import type { Request, Response } from 'express';

const notFound = (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'API Not Found!',
    error: '',
  });
};

export default notFound;
