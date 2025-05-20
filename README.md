# Book Review API

Hey there! 

This is a simple Book Review API built with Node.js and Express. It uses NeonDB (PostgreSQL) for the database and JWT for authentication using middleware. 

All the API endpoints for this Book Review system are included in this project.
I have used Swagger UI to document and test the APIs, so you can easily see what each API does, what input it expects, and what output it returns. This makes it super easy for your friends or other developers to understand and use the API without confusion.

The project also includes necessary middleware for:

Parsing JSON requests

Handling authentication via JWT

Validating user sessions

Handling errors properly
![image](https://github.com/user-attachments/assets/465267d6-93cc-410f-819d-518d5659ece9)


# Below are the steps to set up and run the project locally, followed by an explanation of what each API endpoint does and the response you can expect.



Step 1: Set up your Node.js environment

Make sure you have Node.js installed. You can check by running:

node -v
npm -v

If you don’t have it, download and install it from nodejs.org.

Step 2: Install dependencies

Open your terminal, go to your project folder, and run:

npm install express pg jsonwebtoken dotenv bcrypt swagger-ui-express swagger-jsdoc nodemon

Step 3: Set up NeonDB (PostgreSQL)

Go to neon.tech and create a free account.

Create a new project and get your database connection string.

Open the SQL editor and run these queries to create your tables:

CREATE TABLE users (
id SERIAL PRIMARY KEY,
email VARCHAR(255) UNIQUE NOT NULL,
password VARCHAR(255) NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE books (
id SERIAL PRIMARY KEY,
title VARCHAR(255) NOT NULL,
author VARCHAR(255) NOT NULL,
genre VARCHAR(100),
description TEXT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reviews (
id SERIAL PRIMARY KEY,
book_id INTEGER REFERENCES books(id),
user_id INTEGER REFERENCES users(id),
rating INTEGER CHECK (rating >= 1 AND rating <= 5),
comment TEXT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

Step 4: Create a .env file

In the root folder of your project, create a file called .env and add:

PORT=3000
DATABASE_URL=your_neon_db_connection_string_here
JWT_SECRET=your_jwt_secret_here

Replace DATABASE_URL with your actual NeonDB connection string.

To generate a strong JWT_SECRET, run this command in terminal:

node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

Copy the output and paste it as your JWT_SECRET.

Step 5: Run the app

To start the server, run:

npm run dev

Step 6: Open Swagger UI to test API

Open your browser and go to:

http://localhost:3000/api-docs

You can explore and test all the API endpoints from there.

# API DETAIL EXPLANATION

1. POST /signup
You send your email and password in JSON format to this API.
The password is encrypted (so nobody can read it directly).
Your user info is saved securely in the database.
If everything goes well, you get a success message.


2. POST /login
You send your email and password in JSON.
The system decrypts the stored password and checks if it matches.
If yes, it creates an access token (like a key) that lets you use other protected APIs.
This access token has a short life (expires soon).
It also creates a refresh token that is stored securely in your browser cookies.
When the access token expires, your frontend automatically uses the refresh token to get a new access token — so you stay logged in without having to enter your details again.
The middleware checks your access token every time you try to use protected APIs to make sure you are allowed.

3. POST /books (Add a new book)
Only logged-in users (with a valid access token) can add books.
You send book details like title, author, genre, description in JSON.
The book is saved in the database.

4. GET /books (Get all books)
Anyone can use this.
You can ask for books page by page (pagination), and also filter by author or genre if you want.
It returns a list of books.

5. GET /books/:id (Get book details by ID)
You give a book ID.
It returns details about the book, including:

Average rating (from all reviews)

List of reviews for that book (also paginated if many reviews)

6. POST /books/:id/reviews (Submit a review)
Only logged-in users can submit a review for a book.
You can only review a book once.
You send your rating and comment in JSON.
The review is saved with your user ID and book ID.

7. PUT /reviews/:id (Update your review)
You can update your own review by sending new rating/comment.
The middleware checks if you are the owner of that review before allowing updates.

8. DELETE /reviews/:id (Delete your review)
You can delete your own review.
Middleware checks your identity to make sure you can only delete your own reviews.

9. GET /search (Search books)
You send a search keyword in the query.
The API finds books whose title or author contains that keyword (not case sensitive, meaning it ignores uppercase or lowercase differences).
Returns all matching books.

10. Middleware Role
It checks if you are logged in (valid access token) before allowing you to add books, review, update, or delete reviews.

It protects your data and actions so no one else can mess with your reviews or add books unless they are authorized.

Handles parsing your JSON requests automatically.
