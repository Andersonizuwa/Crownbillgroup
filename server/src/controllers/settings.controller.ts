import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';

const settingsFilePath = path.join(__dirname, '..', '..', 'settings.json');

export const getSettings = async (req: Request, res: Response) => {
  try {
    const settings = await fs.readFile(settingsFilePath, 'utf-8');
    res.json(JSON.parse(settings));
  } catch (error) {
    res.status(500).json({ error: 'Failed to read settings' });
  }
};
