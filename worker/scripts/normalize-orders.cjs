const { execSync } = require('child_process');
const fs = require('fs');

function runQuery(query) {
    try {
        const cmd = `npx wrangler d1 execute learning-platform-db --remote --command "${query.replace(/"/g, '\\"')}" --json`;
        const output = execSync(cmd, { cwd: '../', encoding: 'utf-8' }); // Run from worker dir context
        const json = JSON.parse(output);
        return json.length ? json[0].results : [];
    } catch (e) {
        console.error("Query failed:", e.message);
        return [];
    }
}

function runBatchUpdates(updates) {
    if (updates.length === 0) return;
    console.log(`Executing ${updates.length} updates...`);
    // Batch in chunks of 20 to avoid command line limits
    const chunkSize = 20;
    for (let i = 0; i < updates.length; i += chunkSize) {
        const chunk = updates.slice(i, i + chunkSize);
        const batchSql = chunk.join('; ');
        try {
            execSync(`npx wrangler d1 execute learning-platform-db --remote --command "${batchSql.replace(/"/g, '\\"')}"`, { cwd: '../', stdio: 'inherit' });
        } catch (e) {
            console.error("Batch failed:", e.message);
        }
    }
}

async function normalize() {
    console.log("Starting Normalization...");

    // 1. Categories
    console.log("--- Normalizing Categories ---");
    const cats = runQuery("SELECT id, display_order, created_at FROM categories WHERE is_deleted = 0 ORDER BY display_order ASC, created_at ASC");
    let catUpdates = [];
    cats.forEach((c, idx) => {
        const correct = idx + 1;
        if (c.display_order !== correct) {
            console.log(`Fixing Category ${c.id}: ${c.display_order} -> ${correct}`);
            catUpdates.push(`UPDATE categories SET display_order = ${correct} WHERE id = '${c.id}'`);
        }
    });
    runBatchUpdates(catUpdates);

    // 2. Courses (Gropped by Category)
    console.log("--- Normalizing Courses ---");
    const courses = runQuery("SELECT id, category, display_order, created_at FROM courses WHERE is_deleted = 0 ORDER BY category, display_order ASC, created_at ASC");
    // Group by category
    const coursesByCat = {};
    courses.forEach(c => {
        const k = c.category || 'uncategorized';
        if (!coursesByCat[k]) coursesByCat[k] = [];
        coursesByCat[k].push(c);
    });

    let courseUpdates = [];
    for (const cat in coursesByCat) {
        coursesByCat[cat].forEach((c, idx) => {
            const correct = idx + 1;
            if (c.display_order !== correct) {
                console.log(`Fixing Course ${c.id} (Cat: ${cat}): ${c.display_order} -> ${correct}`);
                courseUpdates.push(`UPDATE courses SET display_order = ${correct} WHERE id = '${c.id}'`);
            }
        });
    }
    runBatchUpdates(courseUpdates);

    // 3. Sections (Grouped by Course)
    console.log("--- Normalizing Sections ---");
    const sections = runQuery("SELECT id, course_id, display_order FROM sections WHERE is_deleted = 0 ORDER BY course_id, display_order ASC");
    const sectionsByCourse = {};
    sections.forEach(s => {
        if (!sectionsByCourse[s.course_id]) sectionsByCourse[s.course_id] = [];
        sectionsByCourse[s.course_id].push(s);
    });

    let sectionUpdates = [];
    for (const cid in sectionsByCourse) {
        sectionsByCourse[cid].forEach((s, idx) => {
            const correct = idx + 1;
            if (s.display_order !== correct) {
                console.log(`Fixing Section ${s.id}: ${s.display_order} -> ${correct}`);
                sectionUpdates.push(`UPDATE sections SET display_order = ${correct} WHERE id = '${s.id}'`);
            }
        });
    }
    runBatchUpdates(sectionUpdates);

    // 4. Simulations (Grouped by Section)
    console.log("--- Normalizing Simulations ---");
    const sims = runQuery("SELECT id, section_id, display_order FROM simulations WHERE is_deleted = 0 ORDER BY section_id, display_order ASC");
    const simsBySection = {};
    sims.forEach(s => {
        if (!simsBySection[s.section_id]) simsBySection[s.section_id] = [];
        simsBySection[s.section_id].push(s);
    });

    let simUpdates = [];
    for (const sid in simsBySection) {
        simsBySection[sid].forEach((s, idx) => {
            const correct = idx + 1;
            if (s.display_order !== correct) {
                console.log(`Fixing Sim ${s.id}: ${s.display_order} -> ${correct}`);
                simUpdates.push(`UPDATE simulations SET display_order = ${correct} WHERE id = '${s.id}'`);
            }
        });
    }
    runBatchUpdates(simUpdates);

    console.log("Normalization Complete.");
}

normalize();
