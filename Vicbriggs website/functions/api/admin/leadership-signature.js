import { requireAdmin } from '../../_lib/auth.js';
import { json, cloud, cloudSignature, handleError } from '../../_lib/http.js';

export async function onRequestPost(context) {
  const denied = await requireAdmin(context);
  if (denied) return denied;
  try {
    cloud(context.env);
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'vicbriggs/leadership';
    return json({
      cloud_name: context.env.CLOUDINARY_CLOUD_NAME,
      api_key: context.env.CLOUDINARY_API_KEY,
      resource_type: 'image',
      folder,
      timestamp,
      signature: await cloudSignature({ folder, timestamp }, context.env.CLOUDINARY_API_SECRET)
    });
  } catch (error) { return handleError(error); }
}
