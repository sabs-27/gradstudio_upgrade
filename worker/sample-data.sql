-- =====================================================
-- SAMPLE DATA FOR LEARNING PLATFORM
-- Matches your existing HTML structure
-- =====================================================

-- =====================================================
-- 1. INSERT COURSES
-- =====================================================

INSERT INTO courses (id, title, icon_class, description, color_theme, display_order, is_active) VALUES
('aws', 'AWS Service Catalog', 'fa-brands fa-aws', 'Master cloud computing with AWS fundamentals', 'orange', 1, 1),
('sql', 'SQL Learning Path', 'fa-solid fa-database', 'Learn databases, queries, and optimization', 'purple', 2, 1),
('gcp', 'Google Cloud Catalog', 'fa-brands fa-google', 'Explore Google Cloud Platform services', 'blue', 3, 1),
('linux', 'Linux Fundamentals', 'fa-brands fa-linux', 'Master Linux commands and system administration', 'green', 4, 1),
('docker', 'Docker & Containers', 'fa-brands fa-docker', 'Build and manage containerized applications', 'cyan', 5, 1);

-- =====================================================
-- 2. INSERT SECTIONS (AWS)
-- =====================================================

INSERT INTO sections (id, course_id, title, display_order) VALUES
('aws-sec-001', 'aws', 'Cloud Foundations', 1),
('aws-sec-002', 'aws', 'Identity & Access Control', 2),
('aws-sec-003', 'aws', 'Compute Services', 3),
('aws-sec-004', 'aws', 'Object & File Storage', 4);

-- =====================================================
-- 3. INSERT SECTIONS (SQL)
-- =====================================================

INSERT INTO sections (id, course_id, title, display_order) VALUES
('sql-sec-001', 'sql', 'Getting Started with SQL', 1),
('sql-sec-002', 'sql', 'Writing Queries', 2),
('sql-sec-003', 'sql', 'Filtering Data', 3);

-- =====================================================
-- 4. INSERT SIMULATIONS (AWS - Cloud Foundations)
-- =====================================================

INSERT INTO simulations (id, section_id, course_id, slug, title, description, icon_class, file_path, has_simulation, display_order, search_text) VALUES
('sim-aws-001', 'aws-sec-001', 'aws', 'understanding-cloud-computing', 'Understanding Cloud Computing', 'Learn what cloud computing is and why it matters', 'fa-cloud', 'simulations/aws/cloud-foundations/cloud-computing.html', 0, 1, 'cloud computing basics introduction overview'),
('sim-aws-002', 'aws-sec-001', 'aws', 'service-models-explained', 'Service Models Explained (IaaS, PaaS, SaaS)', 'Understand the differences between service models', 'fa-layer-group', 'simulations/aws/cloud-foundations/service-models.html', 0, 2, 'iaas paas saas service models infrastructure platform software'),
('sim-aws-003', 'aws-sec-001', 'aws', 'cloud-deployment-types', 'Cloud Deployment Types', 'Public, private, and hybrid cloud explained', 'fa-network-wired', 'simulations/aws/cloud-foundations/deployment-types.html', 0, 3, 'public private hybrid cloud deployment models'),
('sim-aws-004', 'aws-sec-001', 'aws', 'getting-started-aws', 'Getting Started with AWS', 'Your first steps in Amazon Web Services', 'fa-rocket', 'simulations/aws/cloud-foundations/getting-started.html', 0, 4, 'aws getting started first steps beginner'),
('sim-aws-005', 'aws-sec-001', 'aws', 'regions-availability-zones', 'AWS Regions & Availability Zones', 'Understanding AWS global infrastructure', 'fa-earth-americas', 'simulations/aws/cloud-foundations/regions-azs.html', 0, 5, 'regions availability zones az infrastructure global'),
('sim-aws-006', 'aws-sec-001', 'aws', 'responsibility-sharing-model', 'Responsibility Sharing Model', 'Learn who manages what in the cloud', 'fa-handshake-simple', 'simulations/aws/cloud-foundations/shared-responsibility.html', 0, 6, 'shared responsibility security compliance'),
('sim-aws-007', 'aws-sec-001', 'aws', 'architecture-best-practices', 'AWS Architecture Best Practices', 'Design principles for cloud applications', 'fa-compass-drafting', 'simulations/aws/cloud-foundations/architecture.html', 0, 7, 'architecture design patterns best practices well architected');

-- =====================================================
-- 5. INSERT SIMULATIONS (AWS - Identity & Access)
-- =====================================================

INSERT INTO simulations (id, section_id, course_id, slug, title, description, icon_class, file_path, has_simulation, display_order, search_text) VALUES
('sim-aws-008', 'aws-sec-002', 'aws', 'introduction-iam', 'Introduction to IAM', 'Identity and Access Management fundamentals', 'fa-user-shield', 'simulations/aws/iam/introduction.html', 0, 1, 'iam identity access management authentication authorization'),
('sim-aws-009', 'aws-sec-002', 'aws', 'users-groups-explained', 'Users & Groups Explained', 'Managing users and organizing with groups', 'fa-users', 'simulations/aws/iam/users-groups.html', 0, 2, 'users groups iam permissions organization'),
('sim-aws-010', 'aws-sec-002', 'aws', 'roles-temporary-access', 'Roles and Temporary Access', 'Understanding IAM roles and temporary credentials', 'fa-id-card', 'simulations/aws/iam/roles.html', 0, 3, 'roles temporary credentials sts assume role'),
('sim-aws-011', 'aws-sec-002', 'aws', 'identity-based-policies', 'Identity-Based Policies', 'Creating and managing IAM policies', 'fa-file-contract', 'simulations/aws/iam/identity-policies.html', 0, 4, 'policies identity based permissions json'),
('sim-aws-012', 'aws-sec-002', 'aws', 'resource-based-policies', 'Resource-Based Policies', 'Policies attached to AWS resources', 'fa-file-shield', 'simulations/aws/iam/resource-policies.html', 0, 5, 'resource policies bucket policy trust policy'),
('sim-aws-013', 'aws-sec-002', 'aws', 'policy-evaluation-logic', 'Policy Evaluation Logic', 'How AWS determines access permissions', 'fa-scale-balanced', 'simulations/aws/iam/policy-evaluation.html', 0, 6, 'policy evaluation logic deny allow explicit implicit');

-- =====================================================
-- 6. INSERT SIMULATIONS (AWS - Compute Services)
-- =====================================================

INSERT INTO simulations (id, section_id, course_id, slug, title, description, icon_class, file_path, has_simulation, display_order, search_text) VALUES
('sim-aws-014', 'aws-sec-003', 'aws', 'ec2-basics', 'EC2 Basics (Simulation)', 'Interactive EC2 instance management', 'fa-server', 'simulations/aws/ec2-basics/index.html', 1, 1, 'ec2 instances virtual machines compute servers'),
('sim-aws-015', 'aws-sec-003', 'aws', 'instance-families-sizing', 'Instance Families & Sizing', 'Choose the right instance type', 'fa-layer-group', 'simulations/aws/compute/instance-types.html', 0, 2, 'instance types families t2 t3 m5 c5 sizing'),
('sim-aws-016', 'aws-sec-003', 'aws', 'cpu-credit-system', 'CPU Credit System', 'Understanding burstable instances', 'fa-stopwatch', 'simulations/aws/compute/cpu-credits.html', 0, 3, 'cpu credits t2 t3 burstable performance'),
('sim-aws-017', 'aws-sec-003', 'aws', 'block-storage-options', 'Block Storage Options', 'EBS volumes and instance store', 'fa-hard-drive', 'simulations/aws/compute/ebs.html', 0, 4, 'ebs elastic block storage volumes snapshots'),
('sim-aws-018', 'aws-sec-003', 'aws', 'ssh-key-management', 'SSH Key Management', 'Secure access to EC2 instances', 'fa-key', 'simulations/aws/compute/ssh-keys.html', 0, 5, 'ssh keys keypair pem security access'),
('sim-aws-019', 'aws-sec-003', 'aws', 'elastic-ip-addressing', 'Elastic IP Addressing', 'Static public IP addresses', 'fa-wifi', 'simulations/aws/compute/elastic-ip.html', 0, 6, 'elastic ip eip static public address'),
('sim-aws-020', 'aws-sec-003', 'aws', 'startup-scripts-userdata', 'Startup Scripts (User Data)', 'Automate instance configuration', 'fa-terminal', 'simulations/aws/compute/user-data.html', 0, 7, 'user data startup scripts automation bootstrap');

-- =====================================================
-- 7. INSERT SIMULATIONS (AWS - Storage)
-- =====================================================

INSERT INTO simulations (id, section_id, course_id, slug, title, description, icon_class, file_path, has_simulation, display_order, search_text) VALUES
('sim-aws-021', 'aws-sec-004', 'aws', 's3-basics', 'S3 Basics (Simulation)', 'Interactive S3 bucket management', 'fa-box-archive', 'simulations/aws/s3-basics/index.html', 1, 1, 's3 simple storage service buckets objects'),
('sim-aws-022', 'aws-sec-004', 'aws', 'buckets-objects', 'Buckets and Objects', 'Understanding S3 storage structure', 'fa-bucket', 'simulations/aws/storage/buckets-objects.html', 0, 2, 's3 buckets objects keys versioning'),
('sim-aws-023', 'aws-sec-004', 'aws', 'storage-classes-explained', 'Storage Classes Explained', 'Choose the right storage tier', 'fa-boxes-stacked', 'simulations/aws/storage/storage-classes.html', 0, 3, 'storage classes standard ia glacier deep archive'),
('sim-aws-024', 'aws-sec-004', 'aws', 'lifecycle-automation', 'Lifecycle Automation', 'Automate object transitions', 'fa-recycle', 'simulations/aws/storage/lifecycle.html', 0, 4, 'lifecycle policies transitions expiration automation'),
('sim-aws-025', 'aws-sec-004', 'aws', 'data-protection-permissions', 'Data Protection & Permissions', 'Secure your S3 data', 'fa-lock', 'simulations/aws/storage/security.html', 0, 5, 'permissions bucket policy acl encryption security'),
('sim-aws-026', 'aws-sec-004', 'aws', 'ebs-vs-efs', 'Amazon EBS vs EFS', 'Block vs file storage comparison', 'fa-hard-drive', 'simulations/aws/storage/ebs-efs.html', 0, 6, 'ebs efs comparison file system shared storage');

-- =====================================================
-- 8. INSERT SIMULATIONS (SQL - Getting Started)
-- =====================================================

INSERT INTO simulations (id, section_id, course_id, slug, title, description, icon_class, file_path, has_simulation, display_order, search_text) VALUES
('sim-sql-001', 'sql-sec-001', 'sql', 'what-is-database', 'What is a Database', 'Understanding database fundamentals', 'fa-database', 'simulations/sql/basics/database-intro.html', 0, 1, 'database fundamentals data storage tables'),
('sim-sql-002', 'sql-sec-001', 'sql', 'what-is-sql', 'What is SQL', 'Introduction to Structured Query Language', 'fa-code', 'simulations/sql/basics/sql-intro.html', 0, 2, 'sql structured query language introduction'),
('sim-sql-003', 'sql-sec-001', 'sql', 'relational-databases-explained', 'Relational Databases Explained', 'Understanding relationships and normalization', 'fa-sitemap', 'simulations/sql/basics/relational.html', 0, 3, 'relational databases normalization relationships foreign keys'),
('sim-sql-004', 'sql-sec-001', 'sql', 'rdbms-benefits-limitations', 'RDBMS Benefits & Limitations', 'Pros and cons of relational systems', 'fa-thumbs-up-down', 'simulations/sql/basics/rdbms.html', 0, 4, 'rdbms benefits limitations acid transactions'),
('sim-sql-005', 'sql-sec-001', 'sql', 'oltp-vs-olap', 'OLTP vs OLAP', 'Transaction vs analytical processing', 'fa-chart-pie', 'simulations/sql/basics/oltp-olap.html', 0, 5, 'oltp olap transaction processing analytics data warehouse');

-- =====================================================
-- 9. INSERT SIMULATIONS (SQL - Writing Queries)
-- =====================================================

INSERT INTO simulations (id, section_id, course_id, slug, title, description, icon_class, file_path, has_simulation, display_order, search_text) VALUES
('sim-sql-006', 'sql-sec-002', 'sql', 'select-statement', 'SELECT Statement', 'Retrieve data from tables', 'fa-magnifying-glass', 'simulations/sql/queries/select.html', 0, 1, 'select query retrieve read data columns'),
('sim-sql-007', 'sql-sec-002', 'sql', 'insert-statement', 'INSERT Statement', 'Add new records to tables', 'fa-plus', 'simulations/sql/queries/insert.html', 0, 2, 'insert add create records rows data'),
('sim-sql-008', 'sql-sec-002', 'sql', 'basic-sql-syntax', 'Basic SQL Syntax', 'Understanding SQL statement structure', 'fa-code', 'simulations/sql/queries/syntax.html', 0, 3, 'syntax structure semicolon keywords'),
('sim-sql-009', 'sql-sec-002', 'sql', 'aliases-as', 'Aliases (AS)', 'Rename columns and tables', 'fa-tag', 'simulations/sql/queries/aliases.html', 0, 4, 'aliases as rename column table names'),
('sim-sql-010', 'sql-sec-002', 'sql', 'limit-offset', 'LIMIT / OFFSET', 'Paginate query results', 'fa-arrow-down-short-wide', 'simulations/sql/queries/limit.html', 0, 5, 'limit offset pagination top skip');

-- =====================================================
-- 10. INSERT SIMULATIONS (SQL - Filtering)
-- =====================================================

INSERT INTO simulations (id, section_id, course_id, slug, title, description, icon_class, file_path, has_simulation, display_order, search_text) VALUES
('sim-sql-011', 'sql-sec-003', 'sql', 'where-clause', 'WHERE Clause', 'Filter rows based on conditions', 'fa-filter', 'simulations/sql/filtering/where.html', 0, 1, 'where filter conditions predicates'),
('sim-sql-012', 'sql-sec-003', 'sql', 'order-by-clause', 'ORDER BY Clause', 'Sort query results', 'fa-arrow-down-z-a', 'simulations/sql/filtering/order-by.html', 0, 2, 'order by sort asc desc ascending descending'),
('sim-sql-013', 'sql-sec-003', 'sql', 'comparison-operators', 'Comparison Operators', 'Equal, greater than, less than', 'fa-scale-unbalanced', 'simulations/sql/filtering/comparison.html', 0, 3, 'comparison operators equal greater less than'),
('sim-sql-014', 'sql-sec-003', 'sql', 'logical-operators', 'Logical Operators', 'AND, OR, NOT operations', 'fa-code-branch', 'simulations/sql/filtering/logical.html', 0, 4, 'logical operators and or not boolean');

-- =====================================================
-- 11. INSERT TAGS FOR SIMULATIONS
-- =====================================================

INSERT INTO tags (simulation_id, tag_name) VALUES
('sim-aws-001', 'beginner'),
('sim-aws-001', 'fundamentals'),
('sim-aws-014', 'compute'),
('sim-aws-014', 'interactive'),
('sim-aws-014', 'guided-practice'),
('sim-aws-021', 'storage'),
('sim-aws-021', 'interactive'),
('sim-aws-021', 'guided-practice'),
('sim-sql-001', 'beginner'),
('sim-sql-001', 'fundamentals'),
('sim-sql-006', 'queries'),
('sim-sql-006', 'essential'),
('sim-sql-011', 'filtering'),
('sim-sql-011', 'essential');

-- =====================================================
-- 12. INSERT INITIAL STATISTICS
-- =====================================================

INSERT INTO statistics (simulation_id, views, likes) VALUES
('sim-aws-014', 1250, 89),
('sim-aws-021', 987, 67),
('sim-sql-006', 543, 42),
('sim-sql-011', 421, 35);

-- =====================================================
-- 13. UPDATE METADATA
-- =====================================================

UPDATE metadata SET value = '40' WHERE key = 'total_simulations';
UPDATE metadata SET value = date('now') WHERE key = 'last_upload_date';
