# How to Write a Good README

## Introduction

As we have already been asking you to submit your work along with a `README.md`. However, I have noticed that most of you are not familiar with what a README file in your project should include. Thus, I decided to share this guideline to tell you what a README is and what a good README should contain.

A README is a text file that introduces and explains a project. It contains information that is commonly required to understand what the project is about, how to set it up, and how to use it.

## README Format

`README.md` follows markdown syntax; you can find the details at [guidelines on GitHub](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax) or [here](https://www.freecodecamp.org/news/github-flavored-markdown-syntax-examples/).

## Setup Instruction

This section is crucial. It should clearly describe how someone can run your project from scratch - assuming they:

- Know the basics of web development
- Can use the terminal command line
- Do not know the details of your specific project or setup
- Expect the app to run easily if they follow instructions step by step, not guessing any missing steps or configuration
- Asking them to open a random IDE WITHOUT any setup is not a good practice

Thus, you should write your instructions as if someone not familiar with your code at all is reading it.

This part should include installing dependencies, starting services, and how to run the code (including backend and frontend).
Please do not state something like "run the code" **without any command line instructions**. Below is an example you can follow (modify according to your own preference).

### A backend instruction example:

**1. Navigate to the backend folder**

```
cd server
```

**2. (Optional but recommended) Set up a Python virtual environment (or conda based on your preference)**

```
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

**3. Install required Python packages**

```
pip install -r requirements.txt
```

**4. Make sure MongoDB is running**
If using Homebrew on macOS:

```
brew services start mongodb-community
```

**5. Import data into the database (if required)**

```
python import_data.py
```

**6. Run the FastAPI server**

```
uvicorn main:app --reload --port 8000
```

API Docs available at: http://localhost:8000/docs

### A frontend instruction example

**1. Navigate to the frontend folder**

```
cd client
```

**2. Install required Node.js packages**

```
npm install
```

**3. Start the React development server**

```
npm run dev
```

**4. Visit the frontend in your browser**
Usually: http://localhost:5173

## Additional Notes (Optional)

You may include:

- Extra setup
- How your folders are organized
- Any known issues or limitations
- Assumptions you made during implementation
