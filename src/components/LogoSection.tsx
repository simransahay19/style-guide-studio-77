import React, { useState, useRef, useEffect } from 'react';
import { useBrandGuide } from '@/context/BrandGuideContext';
import { LogoVariation, LogoSet } from '@/types';
import { LogoPreview } from '@/components/ui/LogoPreview';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  UploadCloud, 
  AlertCircle, 
  X, 
  Crop, 
  ZoomIn, 
  ZoomOut, 
  Move,
  ArrowRight
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { LogoDropzone } from './LogoDropzone';
import { LogoCropper } from './LogoCropper';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { uploadBase64ToStorage } from '@/utils/firebaseStorage';

interface LogoVariationCreatorProps {
  originalLogo: string;
  onComplete: (variations: LogoVariation[]) => void;
}

function LogoVariationCreator({ originalLogo, onComplete }: LogoVariationCreatorProps) {
  const generateVariations = () => {
    const variations: LogoVariation[] = [];
    
    // Updated background colors - white, black, blue, light pink
    const backgroundColors = [
      '#FFFFFF', // White
      '#000000', // Black  
      '#3E3BFF', // Brand Blue
      '#FFEAEA'  // Light Pink
    ];
    
    backgroundColors.forEach(backgroundColor => {
      variations.push({
        src: originalLogo,
        background: backgroundColor,
        type: 'color'
      });
    });
    
    onComplete(variations);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Create Logo Variations</h3>
        <p className="text-sm text-muted-foreground">
          We'll create standard logo variations for different backgrounds and use cases.
          In a real application, this would process the logo to create true single-color versions.
        </p>
      </div>
      
      <div className="w-full max-w-xs mx-auto">
        <img 
          src={originalLogo} 
          alt="Original Logo" 
          className="w-full h-auto border border-border rounded-md p-4"
        />
        <p className="text-center text-sm mt-2">Your Uploaded Logo</p>
      </div>
      
      <div className="flex justify-end">
        <Button onClick={generateVariations}>
          Generate Logo Variations
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// Unified logo display component with consistent background colors and cropping
const LogoDisplay = ({ logo, shape, index }: { logo: any; shape: 'square' | 'rounded' | 'circle'; index: number }) => {
  const backgroundColors = [
    { color: '#FFFFFF', bgClass: 'bg-white', borderClass: 'border-2 border-gray-200', label: 'White' },
    { color: '#000000', bgClass: 'bg-black', borderClass: '', label: 'Black' },
    { color: '#3E3BFF', bgClass: 'bg-blue-600', borderClass: '', label: 'Blue' },
    { color: '#FFEAEA', bgClass: 'bg-pink-100', borderClass: '', label: 'Light Pink' }
  ];

  const backgroundConfig = backgroundColors[index % backgroundColors.length];

  const getShapeClasses = () => {
    switch (shape) {
      case 'square':
        return 'rounded-none';
      case 'rounded':
        return 'rounded-lg';
      case 'circle':
        return 'rounded-full';
      default:
        return 'rounded-none';
    }
  };

  return (
    <div className="text-center bg-gray-50 rounded-lg p-4 avoid-break">
      <div className={`flex items-center justify-center p-4 rounded-lg shadow-sm mb-3 mx-auto ${backgroundConfig.bgClass} ${backgroundConfig.borderClass}`}>
        <div className={`w-24 h-24 overflow-hidden ${getShapeClasses()}`}>
          <img 
            src={logo.src} 
            alt={`${shape} logo ${index + 1}`}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      <p className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
        Full Color on {backgroundConfig.label} Background
      </p>
    </div>
  );
};

export function LogoSection() {
  const { currentGuide, updateLogos } = useBrandGuide();
  const { toast } = useToast();
  const { user } = useAuth();
  const [showUploader, setShowUploader] = useState(!currentGuide.logos.original);
  const [showCropper, setShowCropper] = useState(false);
  const [uploadedImage, setUploadedImage] = useState('');
  const [croppedImage, setCroppedImage] = useState('');
  const [showVariationCreator, setShowVariationCreator] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const handleLogoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setUploadedImage(e.target.result as string);
        setShowUploader(false);
        setShowCropper(true);
      }
    };
    reader.readAsDataURL(file);
  };
  
  const handleCropComplete = async (croppedImage: string) => {
    setUploading(true);
    
    try {
      let finalLogoUrl = croppedImage;
      
      // If user is signed in, upload to Firebase Storage
      if (user) {
        console.log('User is signed in, uploading logo to Firebase Storage...');
        finalLogoUrl = await uploadBase64ToStorage(croppedImage, user.uid, 'brand_logo.png');
        console.log('Logo uploaded to Firebase Storage:', finalLogoUrl);
      }
      
      const updatedLogos: LogoSet = {
        ...currentGuide.logos,
        original: finalLogoUrl
      };
      
      updateLogos(updatedLogos);
      setCroppedImage(finalLogoUrl);
      setShowCropper(false);
      setShowVariationCreator(true);
      
      // Updated toast notifications based on user status
      if (user) {
        toast({
          title: "Logo uploaded successfully",
          description: "Your logo has been saved to the cloud and is ready for sharing.",
        });
      } else {
        toast({
          title: "Logo saved locally",
          description: "Your logo has been saved to your browser. Sign in to save to the cloud and create shareable links.",
        });
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "There was an error uploading your logo. Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };
  
  const handleVariationsComplete = (variations: LogoVariation[]) => {
    const updatedLogos: LogoSet = {
      ...currentGuide.logos,
      square: variations,
      rounded: variations,
      circle: variations
    };
    
    updateLogos(updatedLogos);
    setShowVariationCreator(false);
  };
  
  const handleDeleteLogo = () => {
    const updatedLogos: LogoSet = {
      original: '',
      square: [],
      rounded: [],
      circle: []
    };
    
    updateLogos(updatedLogos);
    setShowUploader(true);
    setShowCropper(false);
    setShowVariationCreator(false);
    setUploadedImage('');
    setCroppedImage('');
  };
  
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Logo Implementation</CardTitle>
          <CardDescription>
            Upload your logo and create variations for different use cases. {!user && "Sign in to save logos to the cloud and create shareable links."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showUploader && (
            <LogoDropzone onUpload={handleLogoUpload} />
          )}
          
          {showCropper && (
            <LogoCropper 
              imageUrl={uploadedImage}
              onCrop={handleCropComplete}
              onCancel={() => {
                setShowCropper(false);
                setShowUploader(true);
              }}
            />
          )}
          
          {uploading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Processing logo...</p>
            </div>
          )}
          
          {showVariationCreator && (
            <LogoVariationCreator 
              originalLogo={croppedImage || currentGuide.logos.original}
              onComplete={handleVariationsComplete}
            />
          )}
          
          {!showUploader && !showCropper && !showVariationCreator && !uploading && currentGuide.logos.original && (
            <div className="space-y-8">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium mb-2">Your Logo</h3>
                  <p className="text-sm text-muted-foreground">
                    View and manage your logo variations.
                    {!user && " Sign in to save logos to the cloud."}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <X className="h-4 w-4 mr-2" />
                        Remove Logo
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove your current logo and all variations. You'll need to upload a new logo.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteLogo}>
                          Yes, remove logo
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              
              <div>
                <img 
                  src={currentGuide.logos.original}
                  alt="Original Logo"
                  className="w-40 h-40 object-contain border border-border rounded-md p-4 mx-auto"
                />
              </div>
              
              <Tabs defaultValue="square" className="w-full">
                <TabsList className="w-full grid grid-cols-3 mb-8">
                  <TabsTrigger value="square">Square</TabsTrigger>
                  <TabsTrigger value="rounded">Rounded</TabsTrigger>
                  <TabsTrigger value="circle">Circle</TabsTrigger>
                </TabsList>
                
                <TabsContent value="square" className="animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {currentGuide.logos.square.map((logo, index) => (
                      <LogoDisplay 
                        key={index}
                        logo={logo}
                        shape="square"
                        index={index}
                      />
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="rounded" className="animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {currentGuide.logos.rounded.map((logo, index) => (
                      <LogoDisplay 
                        key={index}
                        logo={logo}
                        shape="rounded"
                        index={index}
                      />
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="circle" className="animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {currentGuide.logos.circle.map((logo, index) => (
                      <LogoDisplay 
                        key={index}
                        logo={logo}
                        shape="circle"
                        index={index}
                      />
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
