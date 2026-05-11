import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { AppConfigService } from '@/config/config.service';
import { Readable } from 'stream';

@Injectable()
export class StorageService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly config: AppConfigService) {
    this.bucketName = String(this.config.get('storage.bucketName') || '');

    const endpoint = String(this.config.get('storage.endpoint') || '');
    const port = String(this.config.get('storage.port') || '');
    const accessKeyId = String(this.config.get('storage.accessKey') || '');
    const secretAccessKey = String(this.config.get('storage.secretKey') || '');

    // Use http if localhost/minio, or a real https URL if it's external S3
    const endpointUrl = endpoint.startsWith('http')
      ? endpoint
      : `http://${endpoint}:${port}`;

    this.s3Client = new S3Client({
      endpoint: endpointUrl,
      region: 'us-east-1', // Required by SDK even if ignored by MinIO
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true, // Crucial for MinIO and compatible S3 clones
    });
  }

  // Save one
  async uploadFile(
    key: string,
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
    });

    try {
      await this.s3Client.send(command);
    } catch (error) {
      this.logger.error(`Failed to upload file to S3: ${key}`, error);
      throw error;
    }
  }

  // Save many
  async uploadFiles(
    files: { key: string; fileBuffer: Buffer; mimeType: string }[],
  ): Promise<void> {
    await Promise.all(
      files.map((file) =>
        this.uploadFile(file.key, file.fileBuffer, file.mimeType),
      ),
    );
  }

  // Read one
  async getFileStream(key: string): Promise<Readable> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      const response = await this.s3Client.send(command);
      return response.Body as Readable;
    } catch (error) {
      this.logger.error(`Failed to retrieve file from S3: ${key}`, error);
      throw error;
    }
  }

  // Read many
  async getFileStreams(
    keys: string[],
  ): Promise<{ key: string; stream: Readable }[]> {
    return await Promise.all(
      keys.map(async (key) => ({
        key,
        stream: await this.getFileStream(key),
      })),
    );
  }

  // Delete one
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      await this.s3Client.send(command);
    } catch (error) {
      this.logger.error(`Failed to delete file from S3: ${key}`, error);
      throw error;
    }
  }

  // Delete many
  async deleteFiles(keys: string[]): Promise<void> {
    if (!keys || keys.length === 0) return;

    const command = new DeleteObjectsCommand({
      Bucket: this.bucketName,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
        Quiet: false,
      },
    });

    try {
      await this.s3Client.send(command);
    } catch (error) {
      this.logger.error(`Failed to bulk delete files from S3`, error);
      throw error;
    }
  }
}
