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

  // Define how many images to fetch per category
  const CATEGORY_LIMITS = {
    portfolio: 10, // 'All' category
    wedding: 10,
    bridal: 10,
    fashion: 10,
    portrait: 10,
    nature: 10,
    street: 10
  };

  // Default to 15 if the category isn't in the list
  const maxResults = CATEGORY_LIMITS[tagToFetch] || 15;

  try {
    const result = await cloudinary.api.resources_by_tag(tagToFetch, {
      max_results: maxResults,
      context: true,
      tags: true,
      direction: 'desc' // Ensures we get the most recently uploaded images first
    });

    return res.status(200).json({ resources: result.resources });
  } catch (error) {
    console.error("Error fetching images:", error);
    return res.status(500).json({ error: 'Failed to fetch images' });
  }
}
