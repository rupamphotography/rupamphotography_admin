import cloudinaryModule from 'cloudinary';

const cloudinary = cloudinaryModule.v2;

cloudinary.config({
  cloud_name: process.env.VITE_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let category = '';
  if (req.query && req.query.category) {
    category = req.query.category;
  } else {
    // Fallback for custom vite dev server which doesn't parse req.query
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    category = url.searchParams.get('category');
  }

  const tagToFetch = !category || category === 'all' ? 'portfolio' : category;

  // IMPORTANT: Keep this in sync with api/get-images.js
  const CATEGORY_LIMITS = {
    portfolio: 10, // 'All'
    wedding: 10,
    bridal: 10,
    fashion: 10,
    portrait: 10,
    nature: 10,
    street: 10
  };

  const limit = CATEGORY_LIMITS[tagToFetch] || 15;

  try {
    const result = await cloudinary.api.resources_by_tag(tagToFetch, {
      max_results: 100, // get up to 100 to count accurately
      context: false,
      tags: false,
      metadata: false
    });

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return res.status(200).json({ 
      count: result.resources.length,
      limit: limit
    });
  } catch (error) {
    console.error("Error fetching count:", error);
    return res.status(500).json({ error: 'Failed to fetch image count' });
  }
}
