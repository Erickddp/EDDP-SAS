-- Tables for Legal Documents and Articles

-- 1. Documents (Laws, Codes, Regulations)
-- Updated schema to match user requirements for Paso 13
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    document_name TEXT NOT NULL,
    filename TEXT NOT NULL,
    abbreviation TEXT,
    category TEXT,
    source TEXT,
    status TEXT DEFAULT 'vigente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Articles (Individual sections of a law)
CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    document_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
    article_number TEXT NOT NULL,
    title TEXT,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_articles_document_id ON articles(document_id);
CREATE INDEX IF NOT EXISTS idx_articles_article_number ON articles(article_number);
