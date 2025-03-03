import CommunityPost from '../Models/CommunityPost.js';

// Create a new community post
export const createPost = async (req, res) => {
    const { title, content } = req.body;

    try {
        const newPost = new CommunityPost({ title, content, author: req.session.userId });
        await newPost.save();
        res.status(201).json(newPost);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all community posts
export const getPosts = async (req, res) => {
    try {
        const posts = await CommunityPost.find();
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}



// Additional methods (update, delete) can be added here... 