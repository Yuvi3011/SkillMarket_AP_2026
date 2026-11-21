CREATE TABLE IF NOT EXISTS roles (
  role_id   SERIAL PRIMARY KEY,
  role_name VARCHAR(50) UNIQUE NOT NULL
);


INSERT INTO roles (role_name) VALUES ('Buyer'), ('Seller'), ('Admin')
ON CONFLICT (role_name) DO NOTHING;


CREATE TABLE IF NOT EXISTS users (
  user_id       SERIAL PRIMARY KEY,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  password      VARCHAR(255) NOT NULL,
  bio           TEXT,
  portfolio_url VARCHAR(300),
  github_url    VARCHAR(300),
  linkedin_url  VARCHAR(300),
  role_id       INTEGER NOT NULL REFERENCES roles(role_id),
  created_at    TIMESTAMP DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS skills (
  skill_id   SERIAL PRIMARY KEY,
  skill_name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS user_skills (
  user_skill_id SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  skill_id      INTEGER NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
  UNIQUE (user_id, skill_id)
);

CREATE TABLE IF NOT EXISTS categories (
  category_id   SERIAL PRIMARY KEY,
  category_name VARCHAR(100) UNIQUE NOT NULL,
  category_icon VARCHAR(50),
  description   TEXT
);


INSERT INTO categories (category_name, category_icon, description) VALUES
  ('Web Development', '💻', 'Custom websites, frontend, backend and full-stack solutions'),
  ('Graphic & UI/UX Design', '🎨', 'Logos, branding, UI wireframes, posters and illustrations'),
  ('Content & Copywriting', '✍️', 'Blog articles, technical writing, resume review and editing'),
  ('Video & Animation', '🎬', 'Reels editing, YouTube video cutting, motion graphics and intros'),
  ('Academic Tutoring', '📚', 'Math, Physics, CS fundamentals, engineering subjects tutoring'),
  ('Coding & Bug Fixing', '⚡', 'Python, Java, C++, JavaScript debugging, scripting and assignments'),
  ('Music & Audio', '🎵', 'Podcast audio cleaning, beats production, voiceovers and mixing'),
  ('Digital Marketing', '📈', 'Social media management, SEO optimization and campus promotion')
ON CONFLICT (category_name) DO NOTHING;


CREATE TABLE IF NOT EXISTS services (
  service_id    SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  category_id   INTEGER NOT NULL REFERENCES categories(category_id) ON DELETE RESTRICT,
  title         VARCHAR(255) NOT NULL,
  description   TEXT NOT NULL,
  price         NUMERIC(10, 2) NOT NULL,
  delivery_time INTEGER NOT NULL, 
  created_at    TIMESTAMP DEFAULT NOW()
);
