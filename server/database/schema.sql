-- StackIt Flow Forum Database Schema
-- Run this file to create the database and all tables

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS stackit_flow_forum;
USE stackit_flow_forum;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(255),
    reputation INT DEFAULT 0,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#007bff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    user_id INT NOT NULL,
    views INT DEFAULT 0,
    votes_count INT DEFAULT 0,
    answers_count INT DEFAULT 0,
    is_answered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Question tags relationship table
CREATE TABLE IF NOT EXISTS question_tags (
    question_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (question_id, tag_id),
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Answers table
CREATE TABLE IF NOT EXISTS answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content TEXT NOT NULL,
    question_id INT NOT NULL,
    user_id INT NOT NULL,
    votes_count INT DEFAULT 0,
    is_accepted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    target_type ENUM('question', 'answer') NOT NULL,
    target_id INT NOT NULL,
    vote_type ENUM('upvote', 'downvote') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_vote (user_id, target_type, target_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert some default tags
INSERT IGNORE INTO tags (name, description, color) VALUES
('javascript', 'JavaScript programming language', '#f7df1e'),
('react', 'React.js library', '#61dafb'),
('nodejs', 'Node.js runtime', '#339933'),
('python', 'Python programming language', '#3776ab'),
('sql', 'Structured Query Language', '#e48e00'),
('css', 'Cascading Style Sheets', '#1572b6'),
('html', 'HyperText Markup Language', '#e34f26'),
('typescript', 'TypeScript programming language', '#3178c6'),
('mongodb', 'MongoDB database', '#47a248'),
('express', 'Express.js framework', '#000000');

-- Insert a default admin user (password: admin123)
INSERT IGNORE INTO users (username, email, password_hash, full_name, is_admin) VALUES
('admin', 'admin@stackitflow.com', '$2b$10$rQZ8K9mN2pL1vX3yU7wE4oP6qR8sT9uV0wX1yZ2aB3cD4eF5gH6iJ7kL8mN9oP0', 'Admin User', TRUE); 