const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
// const Post = require('../../models/User');
const User = require('../../models/User');

// @route POST api/posts
// @desc Create post
//@access Private
router.post('/',
  auth,
  check('text', 'Text is required').notEmpty(),
async (req, res) => {
    // res.send('Post route hit');
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    try {
       
        const user = await User.findById(req.user.id).select('-password');

        const newPost = new Post({
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        });

        const post = await newPost.save();

        res.json(post);
    

    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server error')
    }
});

// @route GET api/posts
// @desc Get all posts
//@access Private
router.get('/', auth, async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 });
        res.json(posts)
    } catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route GET api/posts/:id
// @desc Get posts by id
//@access Private
router.get('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post){
            return res.status(404).json({ msg: 'Post not found' });
        }

        res.json(post)
    } catch(err){
        console.error(err.message);
        if (err.kind=='ObjectId'){
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route DELETE api/posts/:id
// @desc Delete a post
//@access Private
router.delete('/:id', auth, async (req, res) => {
    try {
        console.log('Delete request for post ID:', req.params.id);
        const post = await Post.findById( req.params.id );
        // post doesn't exist
        if (!post){
            console.log('Post not found');
            return res.status(404).json({ msg: 'Post not found' });
        }
        // check user
        if (post.user.toString() != req.user.id){
            console.log('Post has no user field');
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await post.deleteOne();
        res.json({ msg: 'Post removed' })
    } catch(err){
        console.error(err.message);
        if (err.kind=='ObjectId'){
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route PUT api/posts/like/:id
// @desc Like a post
//@access Private
router.put('/like/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        //Check if the post has already been like by the user
        if(post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
            return res.status(400).json({ msg: 'Post already liked' });
        }
        post.likes.unshift({ user: req.user.id });

        await post.save();

        res.json(post.likes);
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})

// @route PUT api/posts/unlike/:id
// @desc Like a post
//@access Private
router.put('/unlike/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        //Check if the post has already been like by the user
        if(post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
            return res.status(400).json({ msg: 'Post has not yet been liked' });
        }
        // Get remove index
        const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);

        post.likes.splice(removeIndex, 1);

        await post.save();

        res.json(post.likes);
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})

// @route POST api/posts/comment/:id
// @desc Comment on a post
//@access Private
router.post('/comment/:id',
  auth,
  check('text', 'Text is required').notEmpty(),
async (req, res) => {
    // res.send('Post route hit');
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    try {
       
        const user = await User.findById(req.user.id).select('-password');
        const post = await Post.findById(req.params.id);
        const newComment = {
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        };

        post.comments.unshift(newComment)

        await post.save();

        res.json(post.comments);
    

    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server error')
    }
});

// @route DELETE api/posts/comment/:id/:comment_id
// @desc Delete comment
//@access Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    console.log('Route hit');
    console.log('Post ID:', req.params.id);
    console.log('Comment ID:', req.params.comment_id);

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    if (!Array.isArray(post.comments)) {
      return res.status(500).json({ msg: 'Post has no comments array' });
    }

    const comment = post.comments.find(
      comment => comment.id === req.params.comment_id
    );

    if (!comment) {
      return res.status(404).json({ msg: 'Comment does not exist' });
    }

    // Check user
    if (!comment.user || comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // Remove comment
    post.comments = post.comments.filter(
      comment => comment.id !== req.params.comment_id
    );

    await post.save();
    res.json(post.comments);

  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).send('Server Error');
  }
});
module.exports = router;