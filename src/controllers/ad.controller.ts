import { deleteImageFromS3, uploadImageToS3 } from "../utils/helpers/imageHandler.helper";


export const uploadImage = async (req, res) => { try {
    const { _id } = req.app.get('user');
    if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No image files provided" });
    }
    // If only one file is uploaded, multer returns it as a single object, not an array
    const files = Array.isArray(req.files) ? req.files : [req.files];
    const results = await uploadImageToS3(files, _id);
    res.json(results); } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error processing image uploads" });
      }
    };

export const removeImage = async (req, res) => {
    const { _id } = req.app.get('user');
    const { Key, uploadedBy } = req.body;
    // Check if the current user ID matches the uploadedBy ID
    if (_id.toString() !== uploadedBy.toString()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      await deleteImageFromS3(Key);
      return res.json({ success: true });
    } catch (error) {
      console.error("Error removing image:", error);
      return res.status(500).json({ error: "Error removing image. Try again." });
    }
  };