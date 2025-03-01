import { supabase } from './supabase';

// Check if user is an admin
async function isAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error checking admin status:', error);
    return false;
  }

  return data?.role === 'admin';
}

export async function uploadVideo(file: File, userId: string) {
  try {
    // Check if user is admin
    const admin = await isAdmin(userId);
    if (!admin) {
      throw new Error('Unauthorized: Only administrators can upload videos');
    }

    // Validate file
    if (!file.type.startsWith('video/')) {
      throw new Error('Invalid file type: Only video files are allowed');
    }

    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File too large: Maximum size is 100MB');
    }

    // Generate secure filename
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['mp4', 'webm', 'mov'];
    if (!fileExt || !allowedExtensions.includes(fileExt)) {
      throw new Error('Invalid file extension');
    }

    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `videos/${fileName}`;

    // Upload file
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('videos')
      .getPublicUrl(filePath);

    // Log upload for audit
    await supabase
      .from('video_uploads')
      .insert({
        file_path: filePath,
        uploaded_by: userId,
        original_name: file.name,
        file_size: file.size,
        content_type: file.type
      });

    return { url: publicUrl, path: filePath };
  } catch (error) {
    console.error('Error uploading video:', error);
    throw error;
  }
}

export async function getVideoUrl(path: string, userId: string) {
  // Check if user has permission to access this video
  const { data: video, error } = await supabase
    .from('video_uploads')
    .select('*')
    .eq('file_path', path)
    .single();

  if (error || !video) {
    throw new Error('Video not found or access denied');
  }

  const { data: { publicUrl } } = supabase.storage
    .from('videos')
    .getPublicUrl(path);
  
  return publicUrl;
}
