module.exports = (req, res) => {
  res.status(200).json({ 
    message: 'API working!',
    env: {
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET
    }
  });
};
