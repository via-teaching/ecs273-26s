# ECS 273 Homework 3
## Joe Morrison

I have never used JavaScript before so this was tough and long to complete.
I also wasn't particularly creative because of this.
I used the line chart, TSNE scatter, and news list recommended in the instructions.
This took me very long since I was learning JavaScript, React, and D3 simultaneously.
I also noticed that there was differences in TSNE values between my work and the posted solutions.
It seems like the normalization, sequence length truncation, and seed were the main differences.
Though I tried looking at both, I decided to use my homework values rather than the solutions.
I think I did the bonus part correctly, but I didn't want the news articles to expand automatically
When switching on the list, it does change the line chart and highlight on TSNE plot.

## Missing Stock
In checking my work, I noticed MMM is missing articles.
This is not an error, I generated the data for this again for this assignment with no recent MMM articles.
I thought about including a larger window, but the processing was slow.

## Environment Setup
I used Anaconda to manage my Python environment for the data generation portions of this assignment.
I used Visual Code Studio for the remaining portion.
I chose the JavaScript template instead of the TypeScript template.
The visualization is built in React with D3.js and run with Node.js.

## Data Generation
The data for this assignment was generated from Homework 1 and Homework 2 scripts, not the provided solutions.
Stock price CSVs were generated using ECS273Homework1T1.py from Homework 1.
News articles were generated using ECS273Homework1T2.py from Homework 1.
The t-SNE coordinates were generated using script.py from Homework 2 Task 2.
These scripts are included my previous homework submissions.
The output files are included in the data folder.

## Visualization Task
### Brief Note
I primarily use MATLAB, but this was written in VS Code using React and D3.js.
I needed a good bit of support because of this, I haven't used either of those or JavaScript previously.
I primarily used Gen AI for syntax learning and support, and videos and forums for learning.
I apologize for any difficulties with my script.
I usually try writing in MATLAB first, but that wasn't very applicable with this.
Instead, I would watch and read tutorials then try to implement slowly.
Note the AI section later for specifics about where I needed assistance with syntax.

### Preparation for Use
Change path to this assignment finishing in ...\ecs273-26s\Homework3\jcmorrison

Needed packages are listed in package.json and installed automatically with npm.
Node.js must be installed to run the visualization.

### How to Use
Please run the following commands in working directory ...\ecs273-26s\Homework3\jcmorrison

    npm install

    npm run dev

Then open a browser and navigate to whatever link is provided.
Use the dropdown in the header to select a stock ticker.
All three views will update automatically when a new stock is selected.

The three views are

Stock Price Overview showing Open, High, Low, and Close lines with zoom interaction

t-SNE Projection of latent representations from Homework 2 with zoom interaction

News articles from Homework 1 with expandable content on click

## A Note on AI Usage
For each of the scripts, because I'm new to JavaScript, I'd start with reading a tutorial or watching a video.
I then would use Claude to iteratively troubleshoot syntax, specifically for D3 which was more difficult for me.
Where this was done specifically is noted in the following section.
I am not a CS student and my familiarity with JavaScript is minimal.
This means I designed the methodology, but had some help with syntax as a new JavaScript coder.
I likely needed more help with basic syntax than the other students in this class, which is noted later.
The ideas are my own, and AI was primarily used for syntax to aid with me learning the language for this.
Specific uses of GenAI are included below.
Again, I am new to JavaScript and not a CS student, so I apologize if my need for syntax assistance was a bit basic.
Thank you for grading!

### Specific Tasks with AI Assistance

***Data Generation***

I used my existing Homework 1 and Homework 2 scripts to generate the data files.
I added lines to my Homework 2 script to export the t-SNE coordinates to a CSV file for use in this assignment.
I had help with the syntax for saving the DataFrame to CSV from GenAI after struggling to save the CSV file.

***Visualization***

For this task, I have no experience with React or D3, so forums and GenAI were helpful for concepts.
Similar to the previous assignments, I'm more comfortable with MATLAB.
This was helpful for the lineChart, newsList, and TSNEScatter scripts.
I tried those in MATLAB first, as much as I could, to get the reasoning down first.
Then I used Claude to help me convert to JavaScript syntax since I haven't written in that previously.
The main and index scripts are unchanged relative to the template.
This was specifically helpful for D3 syntax with React use of useRef and useEffects.
I started with the zoom behvaior reference provided by the course for rescaleX and rescaleY API calls.
Again, I needed support for troubleshooting my script here.
The gramener resource and dsindepth resources were helpful for mouse interactions and animation.
I was able to get these down, but needed a small amount of syntax troubleshooting.
Similar to previous assignments, there was not copy and paste without modification as requested.
I needed help with syntax, but this was primarily troubleshooting and learning how to use libraries, as noted.
Almost all of the assistance needed were in the lineChart, newsList, and TSNEScatter scripts.
As mentiioned previously, none of this was copied without being checked.
Instead I used the examples from the course and tutorials then had help troubleshooting syntax for these files.
I apologize for any odd writing styles that come with a MATLAB coder writing JavaScript.
I know some of this explanation is copied from previous homeworks but the needs were similar so that's intentional.
Thank you for your patience with my work.
