import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { generateReactHelpers } from "@uploadthing/react/hooks";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export const { useUploadThing } = generateReactHelpers();

export const MultiUploader = ({
  coverUrl,
  setCoverUrl,
  onChange,
  defaultFile,
  defaultPreviewUrl,
  isPending,
}) => {
  const [file, setFile] = useState(defaultFile);
  const [previewUrl, setPreviewUrl] = useState(defaultPreviewUrl);
  const [isRemoved, setIsRemoved] = useState(false);

  const handleDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];

      if (file) {
        onChange(file, false); // Pass isRemoved as false
        setFile(file);
        const previewURL = URL.createObjectURL(file);
        setPreviewUrl(previewURL);
        setIsRemoved(false);
      }
    },
    [onChange]
  );

  useEffect(() => {
    if (isRemoved) {
      setPreviewUrl(null);
    } else if (defaultFile instanceof File) {
      const previewURL = URL.createObjectURL(defaultFile);
      setPreviewUrl(previewURL);
    } else if (defaultPreviewUrl) {
      setPreviewUrl(defaultPreviewUrl);
    }
  }, [isRemoved, defaultPreviewUrl, defaultFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    multiple: false,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
  });

  const { startUpload } = useUploadThing({
    endpoint: "personalPhoto",
    onClientUploadComplete: (files) => {
      if (files && files[0]) {
        setCoverUrl(files[0].fileUrl);
        toast({
          title: "Upload successful",
          description: "Image has been uploaded.",
          variant: "success",
        });
      }
    },
    onUploadError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setFile(null);
    setIsRemoved(true);
    onChange(null, true); // Pass isRemoved as true
  };

  return (
    <div className="upload-container" disabled={isPending}>
      {previewUrl ? (
        <div className="mb-6 border-dashed border-border border-2 rounded-md p-4 flex justify-between items-center text-sm transition hover:border-indigo-600 cursor-pointer">
          <div className="flex items-center gap-x-2">
            <Image
              src={previewUrl}
              alt="Preview"
              width={200}
              height={200}
              className="preview-image"
              onError={() => setPreviewUrl(null)}
            />
          </div>
          <div>
            <Button onClick={removeImage} variant="destructive">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            "mb-6 border-dashed border-border border-2 rounded-md p-2 flex flex-col items-center justify-center text-sm transition hover:border-indigo-600 cursor-pointer",
            { active: isDragActive }
          )}
        >
          <input {...getInputProps()} />
          <p>
            {isDragActive
              ? "Drop the picture here"
              : "Drag and drop a picture here, or click to select one"}
          </p>
        </div>
      )}
    </div>
  );
};





