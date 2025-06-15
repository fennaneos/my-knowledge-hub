---
id: python-project-bootstrap
title: Python Project Bootstrap
sidebar_label: Python Basic Setup
---

# 🐍 Python Project Bootstrap

Get your Python project up and running in minutes with this quick-start guide. Perfect for creating isolated environments, managing dependencies, and preparing your project for Git version control.

---

## 🧱 Recommended Project Structure

```bash
my-project/
├── venv/               # Virtual environment (not committed)
├── main.py             # Your application’s entry point
├── requirements.txt    # Dependency list
└── .gitignore          # Files/folders to exclude from Git
```


## 🛠️ Create a Virtual Environment

```bash
python -m venv venv
```

## ▶️ Activate It
Windows:

```bash
venv\Scripts\activate
```


Mac/Linux:
```bash
source venv/bin/activate
```


## 📦 Install Dependencies
```bash
pip install -r requirements.txt
```

## 📄 Create a requirements.txt
```bash
pip freeze > requirements.txt
```

## 🧽 Add a .gitignore
```bash
venv/
__pycache__/
*.pyc
```


## 📚 Initialize Git (Optional)

Set up Git to track your new project:
```bash
git init
git add .
git commit -m "Initial Python project setup"
```

Push to GitHub if needed:
```bash
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```