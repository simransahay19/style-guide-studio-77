
import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { ZoomIn, ZoomOut, Crop as CropIcon } from 'lucide-react';

interface LogoCropperProps {
  imageUrl: string;
  onCrop: (croppedImage: string) => void;
  onCancel: () => void;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

export function LogoCropper({ imageUrl, onCrop, onCancel }: LogoCropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // This creates a preview canvas when crop completes
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1)); // Square aspect ratio
  }, []);

  const handleComplete = useCallback(() => {
    if (completedCrop && imgRef.current) {
      const image = imgRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No 2d context');
      }

      // Calculate the size of the cropped area at the original scale
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      // Set the canvas size to the cropped area dimensions
      canvas.width = completedCrop.width * scaleX;
      canvas.height = completedCrop.height * scaleY;

      // Draw only the cropped area onto the canvas
      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Convert to base64
      const base64Image = canvas.toDataURL('image/png');
      onCrop(base64Image);
    }
  }, [completedCrop, onCrop]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Crop Your Logo</h3>
        <p className="text-sm text-muted-foreground">
          Position your logo within the square crop frame. You can drag to position and use the zoom slider for better fit.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={1}
          className="max-h-[500px] mx-auto border rounded-lg overflow-hidden"
        >
          <img
            ref={imgRef}
            src={imageUrl}
            style={{ transform: `scale(${scale})` }}
            alt="Logo to crop"
            onLoad={onImageLoad}
            crossOrigin="anonymous"
          />
        </ReactCrop>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium">Zoom</label>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setScale((prev) => Math.max(0.5, prev - 0.1))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setScale((prev) => Math.min(3, prev + 0.1))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Slider
            value={[scale * 100]}
            onValueChange={(values) => setScale(values[0] / 100)}
            min={50}
            max={300}
            step={10}
            className="my-4"
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleComplete}>
            <CropIcon className="h-4 w-4 mr-2" />
            Crop Logo
          </Button>
        </div>
      </div>
    </div>
  );
}
