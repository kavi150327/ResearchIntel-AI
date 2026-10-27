"""
Research Abstract Classification & Trend Discovery Platform
FastAPI Machine Learning & NLP Backend Service with Persistent SQLite Database
B.Tech Artificial Intelligence and Data Science Mini-Project
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import sqlite3
import os
import json
import pandas as pd
import numpy as np
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.cluster import KMeans
from sklearn.decomposition import LatentDirichletAllocation
from sklearn.metrics import confusion_matrix, accuracy_score, precision_recall_fscore_support
from sklearn.model_selection import train_test_split

DB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
os.makedirs(DB_DIR, exist_ok=True)
DB_PATH = os.path.join(DB_DIR, "research_intelligence.sqlite")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Initialize real SQLite tables in Python backend
def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS datasets (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            filename TEXT NOT NULL,
            record_count INTEGER NOT NULL,
            categories_json TEXT NOT NULL,
            year_min INTEGER,
            year_max INTEGER,
            has_labels INTEGER NOT NULL,
            status TEXT NOT NULL,
            is_synthetic INTEGER NOT NULL,
            uploaded_at TEXT NOT NULL
        );
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS papers (
            id TEXT PRIMARY KEY,
            dataset_id TEXT NOT NULL,
            title TEXT NOT NULL,
            abstract TEXT NOT NULL,
            publication_year INTEGER,
            category TEXT,
            keywords_json TEXT,
            authors_json TEXT,
            cleaned_abstract TEXT,
            tokens_json TEXT,
            predicted_category TEXT,
            prediction_confidence REAL,
            topic_id INTEGER,
            topic_label TEXT,
            FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
        );
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS model_evaluations (
            id TEXT PRIMARY KEY,
            dataset_id TEXT NOT NULL,
            model_type TEXT NOT NULL,
            model_name TEXT NOT NULL,
            train_count INTEGER NOT NULL,
            test_count INTEGER NOT NULL,
            accuracy REAL NOT NULL,
            macro_precision REAL NOT NULL,
            macro_recall REAL NOT NULL,
            macro_f1 REAL NOT NULL,
            weighted_f1 REAL NOT NULL,
            per_class_json TEXT NOT NULL,
            confusion_matrix_json TEXT NOT NULL,
            feature_count INTEGER NOT NULL,
            trained_at TEXT NOT NULL,
            FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
        );
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS discovered_topics (
            id INTEGER,
            dataset_id TEXT NOT NULL,
            label TEXT NOT NULL,
            top_terms_json TEXT NOT NULL,
            paper_count INTEGER NOT NULL,
            percentage REAL NOT NULL,
            year_distribution_json TEXT NOT NULL,
            representative_papers_json TEXT NOT NULL,
            PRIMARY KEY (dataset_id, id),
            FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
        );
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS trend_analytics (
            dataset_id TEXT PRIMARY KEY,
            years_json TEXT NOT NULL,
            yearly_counts_json TEXT NOT NULL,
            category_growth_json TEXT NOT NULL,
            topic_activity_json TEXT NOT NULL,
            category_totals_json TEXT NOT NULL,
            emerging_candidates_json TEXT NOT NULL,
            formula_details_json TEXT NOT NULL,
            analyzed_at TEXT NOT NULL,
            FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
        );
    """)
    conn.commit()
    conn.close()

init_db()

app = FastAPI(
    title="Research Abstract Intelligence ML Backend",
    description="Python FastAPI backend powered by scikit-learn, pandas, numpy, and disk-persistent SQLite.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STOPWORDS = set([
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
    "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but",
    "by", "can", "cannot", "could", "did", "do", "does", "doing", "down", "during", "each", "few",
    "for", "from", "further", "had", "has", "have", "having", "he", "her", "here", "hers", "herself",
    "him", "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself", "me", "more",
    "most", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other",
    "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "she", "should", "so", "some",
    "such", "than", "that", "the", "their", "theirs", "them", "themselves", "then", "there", "these",
    "they", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "we",
    "were", "what", "when", "where", "which", "while", "who", "whom", "why", "with", "would", "you",
    "your", "yours", "yourself", "yourselves",
    "paper", "propose", "proposed", "present", "study", "approach", "method", "results", "demonstrate",
    "evaluation", "achieve", "based", "using", "state-of-the-art", "novel"
])

def nlp_clean_text(text: str, lowercase: bool = True, remove_stopwords: bool = True) -> str:
    if not isinstance(text, str):
        return ""
    if lowercase:
        text = text.lower()
    tokens = re.findall(r'[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*', text)
    if remove_stopwords:
        tokens = [t for t in tokens if t.lower() not in STOPWORDS and len(t) > 2]
    return " ".join(tokens)

@app.get("/api/health")
def health_check():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT count(*) as count FROM datasets")
    ds_count = cursor.fetchone()["count"]
    cursor.execute("SELECT count(*) as count FROM papers")
    paper_count = cursor.fetchone()["count"]
    conn.close()

    return {
        "status": "healthy",
        "engine": "Python FastAPI Scikit-Learn NLP Engine",
        "database": {
            "type": "SQLite 3.x Disk Database",
            "file_path": DB_PATH,
            "datasets_count": ds_count,
            "papers_count": paper_count
        }
    }

@app.get("/api/db/query")
def execute_sql(sql: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(sql)
        columns = [col[0] for col in cursor.description] if cursor.description else []
        rows = [list(r) for r in cursor.fetchall()]
        conn.commit()
        return {"columns": columns, "rows": rows}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
