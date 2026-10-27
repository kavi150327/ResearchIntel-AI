# Python FastAPI NLP & Machine Learning Backend

This directory provides the standalone Python FastAPI implementation for the **Research Abstract Classification & Trend Discovery Platform** (B.Tech AI & Data Science Mini-Project).

## Quick Start

1. Ensure you have Python 3.10+ installed.
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install required packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
5. View interactive Swagger API documentation at:
   `http://localhost:8000/docs`

## Machine Learning Pipeline Features

- **TF-IDF Vectorization**: Sublinear term-frequency scaling with unigram and bigram features, removing academic boilerplate stop-words.
- **Supervised Classifiers**:
  - `multinomial_nb`: Multinomial Naive Bayes with Laplace smoothing ($\alpha=1.0$).
  - `logistic_regression`: Multi-class Logistic Regression with L2 regularization ($C=1.0$).
  - `linear_svm`: Linear Support Vector Classification (`LinearSVC`).
- **Unsupervised Topic Discovery**:
  - `kmeans`: K-Means clustering with cluster center term extraction.
  - `lda`: Latent Dirichlet Allocation topic modeling with component term distributions.
- **Evaluation**: Held-out train/test split with exact confusion matrix, accuracy, and per-class precision, recall, and F1 scores.
