import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// DigitalOcean Spaces configuration (S3-compatible)
const spacesEndpoint = process.env.DO_SPACES_ENDPOINT || 'https://fra1.digitaloceanspaces.com';
const spacesRegion = process.env.DO_SPACES_REGION || 'fra1';
const spacesBucket = process.env.DO_SPACES_BUCKET || 'gogomarket';
const spacesKey = process.env.DO_SPACES_KEY || '';
const spacesSecret = process.env.DO_SPACES_SECRET || '';
const spacesCdnUrl = process.env.DO_SPACES_CDN_URL || `https://${spacesBucket}.${spacesRegion}.digitaloceanspaces.com`;

// Initialize S3 client for DO Spaces
const s3Client = new S3Client({
  endpoint: spacesEndpoint,
  region: spacesRegion,
  credentials: {
    accessKeyId: spacesKey,
    secretAccessKey: spacesSecret,
  },
});

class UploadService {
  private isConfigured(): boolean {
    return !!(spacesKey && spacesSecret);
  }

  // Upload file to DO Spaces
  async uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    folder: string = 'uploads'
  ): Promise<{ url: string; key: string }> {
    if (!this.isConfigured()) {
      // Return placeholder URL if not configured
      console.log('[UPLOAD] DO Spaces not configured, using placeholder');
      const placeholderKey = `${folder}/${uuidv4()}${path.extname(originalName)}`;
      return {
        url: `https://placeholder.gogomarket.uz/${placeholderKey}`,
        key: placeholderKey,
      };
    }

    const ext = path.extname(originalName);
    const key = `${folder}/${uuidv4()}${ext}`;

    const command = new PutObjectCommand({
      Bucket: spacesBucket,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      ACL: 'public-read',
    });

    await s3Client.send(command);

    return {
      url: `${spacesCdnUrl}/${key}`,
      key,
    };
  }

  // Upload video
  async uploadVideo(fileBuffer: Buffer, originalName: string, mimeType: string): Promise<{ url: string; key: string }> {
    return this.uploadFile(fileBuffer, originalName, mimeType, 'videos');
  }

  // Upload image
  async uploadImage(fileBuffer: Buffer, originalName: string, mimeType: string): Promise<{ url: string; key: string }> {
    return this.uploadFile(fileBuffer, originalName, mimeType, 'images');
  }

  // Upload product image
  async uploadProductImage(fileBuffer: Buffer, originalName: string, mimeType: string): Promise<{ url: string; key: string }> {
    return this.uploadFile(fileBuffer, originalName, mimeType, 'products');
  }

  // Delete file from DO Spaces
  async deleteFile(key: string): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log('[DELETE] DO Spaces not configured, skipping delete');
      return true;
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: spacesBucket,
        Key: key,
      });
      await s3Client.send(command);
      return true;
    } catch (error) {
      console.error('Delete file error:', error);
      return false;
    }
  }
}

export default new UploadService();
