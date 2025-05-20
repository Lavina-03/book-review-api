const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../middleware/authenticateToken');

/**
 * @route POST /books
 * @desc Add a new book (authenticated users only)
 * @access Private
 */
/**
 * @swagger
 * /books:
 *   post:
 *     summary: Add a new book (authentication required)
 *     tags:
 *       - Books
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - author
 *             properties:
 *               title:
 *                 type: string
 *               author:
 *                 type: string
 *               genre:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Book created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized (missing or invalid token)
 */

router.post('/', authenticateToken, async (req, res) => {
  const { title, author, genre, description } = req.body;
  if (!title || !author) {
    return res.status(400).json({ error: 'Title and author are required' });
  }
  try {
    const result = await db.query(
      `INSERT INTO books (title, author, genre, description) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [title, author, genre || null, description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error inserting book:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
/**
 * @swagger
 * components:
 *   schemas:
 *     Book:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         title:
 *           type: string
 *           example: The Great Gatsby
 *         author:
 *           type: string
 *           example: F. Scott Fitzgerald
 *         genre:
 *           type: string
 *           example: Fiction
 *         description:
 *           type: string
 *           example: A novel set in the 1920s...
 */
/**
 * @route GET /books/search
 * @desc Search books by title or author (partial + case-insensitive)
 * @access Public
 */


/**
 * @route GET /books
 * @desc Get all books with pagination and optional filters by author and genre
 * @access Public
 */
/**
 * @swagger
 * /books:
 *   get:
 *     summary: Retrieve a list of books
 *     tags:
 *       - Books
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of books per page
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *         description: Filter books by author
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Filter books by genre
 *     responses:
 *       200:
 *         description: List of books
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 books:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Book'
 */


router.get('/', async (req, res) => {
  const { page = 1, limit = 10, author, genre } = req.query;
  const offset = (page - 1) * limit;

  let baseQuery = 'SELECT * FROM books';
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (author) {
    conditions.push(`LOWER(author) LIKE LOWER($${paramIndex++})`);
    params.push(`%${author}%`);
  }
  if (genre) {
    conditions.push(`LOWER(genre) LIKE LOWER($${paramIndex++})`);
    params.push(`%${genre}%`);
  }
  if (conditions.length > 0) {
    baseQuery += ' WHERE ' + conditions.join(' AND ');
  }
  baseQuery += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit);
  params.push(offset);

  try {
    const result = await db.query(baseQuery, params);
    res.json({ page: +page, limit: +limit, books: result.rows });
  } catch (err) {
    console.error('Error fetching books:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
/**
 * @swagger
 * /books/search:
 *   get:
 *     summary: Search books by title or author
 *     tags:
 *       - Additional Features
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Search keyword (title or author)
 *     responses:
 *       200:
 *         description: List of matching books
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Book'
 *       400:
 *         description: Missing search query
 */

router.get('/search', async (req, res) => {
  const searchQuery = req.query.query;

  if (!searchQuery) {
    return res.status(400).json({ error: 'Missing search query' });
  }

  try {
    const result = await db.query(
      `SELECT * FROM books 
       WHERE LOWER(title) LIKE LOWER($1) 
          OR LOWER(author) LIKE LOWER($1)`,
      [`%${searchQuery}%`]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error searching books:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route GET /books/:id
 * @desc Get book details by ID, including average rating and paginated reviews
 * @access Public
 */
/**
 * @swagger
 * /books/{id}:
 *   get:
 *     summary: Get details of a single book by ID
 *     tags:
 *       - Books
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The book ID
 *     responses:
 *       200:
 *         description: Book details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       404:
 *         description: Book not found
 */

router.get('/:id', async (req, res) => {
  const bookId = req.params.id;
  const { reviewPage = 1, reviewLimit = 5 } = req.query;
  const reviewOffset = (reviewPage - 1) * reviewLimit;

  try {
    const bookResult = await db.query('SELECT * FROM books WHERE id = $1', [bookId]);
    if (bookResult.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    const book = bookResult.rows[0];

    // Get average rating
    const avgRatingResult = await db.query(
      'SELECT AVG(rating)::numeric(10,2) AS average_rating FROM reviews WHERE book_id = $1',
      [bookId]
    );
    const average_rating = avgRatingResult.rows[0].average_rating || 0;

    // Get paginated reviews
    const reviewsResult = await db.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.email
       FROM reviews r 
       JOIN users u ON r.user_id = u.id
       WHERE r.book_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [bookId, reviewLimit, reviewOffset]
    );

    res.json({
      book,
      average_rating: parseFloat(average_rating),
      reviews: reviewsResult.rows,
      reviewPage: +reviewPage,
      reviewLimit: +reviewLimit
    });
  } catch (err) {
    console.error('Error fetching book details:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route POST /books/:id/reviews
 * @desc Submit a review for a book (authenticated, one review per user per book)
 * @access Private
 */
/**
 * @swagger
 * /books/{id}/reviews:
 *   post:
 *     summary: Submit a review for a book (authentication required)
 *     tags:
 *       - Reviews
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the book to review
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       400:
 *         description: Invalid input or user already reviewed
 *       401:
 *         description: Unauthorized (missing or invalid token)
 */

router.post('/:id/reviews', authenticateToken, async (req, res) => {
  const bookId = req.params.id;
  const userId = req.user.id;
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    // Check if book exists
    const bookCheck = await db.query('SELECT id FROM books WHERE id = $1', [bookId]);
    if (bookCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Check if user already reviewed this book
    const existingReview = await db.query(
      'SELECT * FROM reviews WHERE book_id = $1 AND user_id = $2',
      [bookId, userId]
    );
    if (existingReview.rows.length > 0) {
      return res.status(400).json({ error: 'You have already reviewed this book' });
    }

    const result = await db.query(
      `INSERT INTO reviews (book_id, user_id, rating, comment) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [bookId, userId, rating, comment || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error submitting review:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route PUT /books/reviews/:id
 * @desc Update your own review
 * @access Private
 */
/**
 * @swagger
 * /books/reviews/{id}:
 *   put:
 *     summary: Update a review by ID (authentication required)
 *     tags:
 *       - Reviews
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       404:
 *         description: Review not found
 */

router.put('/reviews/:id', authenticateToken, async (req, res) => {
  const reviewId = req.params.id;
  const userId = req.user.id;
  const { rating, comment } = req.body;

  if (rating && (rating < 1 || rating > 5)) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    // Check review exists and belongs to user
    const reviewResult = await db.query('SELECT * FROM reviews WHERE id = $1', [reviewId]);
    if (reviewResult.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found or not yours to edit' });
    }

    const updatedRating = rating || reviewResult.rows[0].rating;
    const updatedComment = comment !== undefined ? comment : reviewResult.rows[0].comment;

    const updateResult = await db.query(
      'UPDATE reviews SET rating = $1, comment = $2 WHERE id = $3 RETURNING *',
      [updatedRating, updatedComment, reviewId]
    );

    res.json(updateResult.rows[0]);
  } catch (err) {
    console.error('Error updating review:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         user_id:
 *           type: integer
 *         book_id:
 *           type: integer
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         comment:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @route DELETE /books/reviews/:id
 * @desc Delete your own review
 * @access Private
 */
/**
 * @swagger
 * /books/reviews/{id}:
 *   delete:
 *     summary: Delete a review by ID (authentication required)
 *     tags:
 *       - Reviews
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID to delete
 *     responses:
 *       204:
 *         description: Review deleted successfully
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       404:
 *         description: Review not found
 */

router.delete('/reviews/:id', authenticateToken, async (req, res) => {
  const reviewId = req.params.id;
  const userId = req.user.id;

  try {
    // Check review exists and belongs to user
    const reviewResult = await db.query('SELECT * FROM reviews WHERE id = $1', [reviewId]);
    if (reviewResult.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found or not yours to delete' });
    }

    await db.query('DELETE FROM reviews WHERE id = $1', [reviewId]);

    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    console.error('Error deleting review:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



module.exports = router;
