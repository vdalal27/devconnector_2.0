const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const { check, validationResult } = require('express-validator');

// @route GET api/profile/me
//@desc Get current users profile
// @access Private
router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);
        if (!profile){
            return res.status(400).json({ msg: 'There is no Profile for this user' })
        }
        res.json(profile);
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route POST api/profile
//@desc Create/Update User Profile
// @access Private

router.post('/', [ auth, [
    check('status', 'Status is required').not().isEmpty(),
    check('skills', 'Skills is required').not().isEmpty()
] ], 
async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const {
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        facebook,
        twitter,
        instagram,
        linkedin
    } = req.body;

    const profileFields = {};
    profileFields.user = req.user.id;
    if(company) profileFields.company = company;
    if(website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
        profileFields.skills = skills.split(',').map(skill => skill.trim());
    }
    // Build social object
    profileFields.social = {}
    if (youtube) profileFields.youtube = youtube;
    if (twitter) profileFields.twitter = twitter;
    if (facebook) profileFields.facebook = facebook;
    if (linkedin) profileFields.linkedin = linkedin;
    if (instagram) profileFields.instagram = instagram;
    
    try {
        let profile = await Profile.findOne({ user: req.user.id });
        if (profile){
            profile = await Profile.findOneAndUpdate(
                { user: req.user.id }, 
                { $set: profileFields },
                { new: true }
            )
            return res.json(profile);
        }
        //Create
        profile = new Profile(profileFields);
        await profile.save();
        res.json(profile);
    } catch(err) {
        console.error(err.message);
        res.send(500).send('Server error')
    }
});

// @route Get api/profile
//@desc Get User Profiles
// @access Public
 
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.json(profiles);
    console.log('Profiles found:', profiles.length);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route Get api/profile/user/:user_id
//@desc Get User Profile by user_id
// @access Public
 
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);
    if(!profile){
        return res.status(400).json({ msg: "No profile exists" });
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if(err.kind == 'ObjectId'){
        return res.status(400).json({ msg: "No profile exists" });
    }
    console.log('Deleting user with ID:', req.user.id);
    res.status(500).send("Server error");
  }
});

// @route DELETE api/profile
//@desc DELETE  User Profile, user and posts
// @access Public
 
router.delete('/', auth, async (req, res) => {
  try {
    await Profile.findOneAndDelete({ user: req.user.id });
    await User.findOneAndDelete({ _id: req.user.id });
    res.json({ msg: "User has been deleted" });
  } catch (err) {
    console.error(err.message);
    if(err.kind == 'ObjectId'){
        return res.status(400).json({ msg: "No profile exists" });
    }

    res.status(500).send("Server error");
  }
});

// @route PUT api/profile/experience
//@desc Add profile, experience
// @access Private
router.put('/experience', [auth, 
    [
    check("title", 'Title is required').not().isEmpty(),
    check("company", 'Company is required').not().isEmpty(),
    check("from", 'From Date is required').not().isEmpty(),
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }
    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    } = req.body

    const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    }

    try {
        console.log('Fetching profile for:', req.user.id);
        const profile = await Profile.findOne({ user: req.user.id });
        if (!profile) {
            return res.status(404).json({ msg: 'Profile not found. Please create a profile first.' });
        }
        profile.experience.unshift(newExp);
        await profile.save();
        res.json(profile);
    } catch(err) {
        console.error(err.message);
        res.status(500).send("Server error")
    }
})

// @route DELETE api/profile/experience/:exp_id
//@desc Delete experience from profile
// @access Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        //Get remove Index
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);

        profile.experience.splice(removeIndex, 1);

        await profile.save();

        res.json(profile);
    } catch(err){
        console.error(err.message);
        res.status(500).send("Server error")
    }
})

// @route PUT api/profile/education
//@desc Add profile, education
// @access Private
router.put('/education', [auth, 
    [
    check("school", 'School is required').not().isEmpty(),
    check("degree", 'Degree is required').not().isEmpty(),
    check("fieldofstudy", 'Field of Study is required').not().isEmpty(),
    check("from", 'From Date is required').not().isEmpty(),
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }
    const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    } = req.body

    const newEdu = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    }

    try {
        // console.log('Fetching profile for:', req.user.id);
        const profile = await Profile.findOne({ user: req.user.id });
        if (!profile) {
            return res.status(404).json({ msg: 'Profile not found. Please create a profile first.' });
        }
        profile.education.unshift(newEdu);
        await profile.save();
        res.json(profile);
    } catch(err) {
        console.error(err.message);
        res.status(500).send("Server error")
    }
})

// @route DELETE api/profile/education/:edu_id
//@desc Delete education from profile
// @access Private
router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        //Get remove Index
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);

        profile.education.splice(removeIndex, 1);

        await profile.save();

        res.json(profile);
    } catch(err){
        console.error(err.message);
        res.status(500).send("Server error")
    }
})


module.exports = router;