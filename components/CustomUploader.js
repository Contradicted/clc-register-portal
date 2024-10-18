import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { generateReactHelpers } from "@uploadthing/react/hooks";
import { cn } from "@/lib/utils";
import { FileIcon, Loader2, X } from "lucide-react";

export const { useUploadThing } = generateReactHelpers();

export const MultiUploader = ({
  coverUrl,
  setCoverUrl,
  onChange,
  defaultFile,
  defaultPreviewUrl,
  isPending,
  isLoading,
  fileType,
}) => {
  const [file, setFile] = useState(defaultFile);
  const [previewUrl, setPreviewUrl] = useState(defaultPreviewUrl);
  const [isRemoved, setIsRemoved] = useState(false);
  const [error, setError] = useState(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
  const formats =
    fileType === "image"
      ? "JPEG, PNG, JPG, WEBP"
      : fileType === "file"
      ? "PDF, DOC, DOCX, JPEG, PNG, JPG, WEBP"
      : "";

  useEffect(() => {
    if (defaultFile && !file) {
      setFile(defaultFile);
    }
    if (defaultPreviewUrl && !previewUrl) {
      setPreviewUrl(defaultPreviewUrl);
    }
  }, [defaultFile, defaultPreviewUrl, file, previewUrl]);

  const handleDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];

      if (file) {
        setError(null); // Clear any previous errors
        onChange(file, false);
        setFile(file);
        if (file.type.startsWith("image/")) {
          const previewURL = URL.createObjectURL(file);
          setPreviewUrl(previewURL);
        } else {
          setPreviewUrl(null); // Clear image preview for non-image files
        }
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
      if (previewUrl && !defaultPreviewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, defaultPreviewUrl]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop: handleDrop,
      multiple: false,
      accept:
        fileType === "image"
          ? {
              "image/*": [".png", ".jpg", ".jpeg", ".webp", ".svg"],
            }
          : fileType === "file"
          ? {
              "image/png": [".png"],
              "image/jpeg": [".jpg", ".jpeg"],
              "image/webp": [".webp"],
              "application/pdf": [".pdf"],
              "application/msword": [".doc"],
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                [".docx"],
            }
          : undefined,
      validator: (file) => {
        if (file.size > MAX_FILE_SIZE) {
          return {
            code: "file-too-large",
            message: "File is larger than 5MB",
          };
        }

        if (fileType === "image") {
          if (!file.type.startsWith("image/")) {
            return {
              code: "file-invalid-type",
              message: `File must be an image`,
            };
          }
        }

        if (fileType === "file") {
          const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          ];
          if (!allowedTypes.includes(file.type)) {
            return {
              code: "file-invalid-type",
              message: "Invalid file type. Please try a different file",
            };
          }
        }
        return null;
      },
    });

  useEffect(() => {
    if (fileRejections.length > 0) {
      setError(fileRejections[0].errors[0].message);
    } else {
      setError(null);
    }
  }, [fileRejections]);

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
      {file ? (
        <div className="mb-6 border-2 border-dashed border-[#384EB7]/30 rounded-md p-4 flex justify-between items-center text-sm transition hover:border-indigo-600 cursor-pointer">
          <div className="flex items-center gap-x-2">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : file.type.startsWith("image/") ? (
              <Image
                src={previewUrl || defaultPreviewUrl}
                alt="Preview"
                width={0}
                height={0}
                className="preview-image object-contain"
                onError={() => setPreviewUrl(null)}
                style={{
                  width: "auto",
                  height: "auto",
                  maxWidth: "200px",
                  maxHeight: "200px",
                  objectFit: "contain",
                }}
              />
            ) : (
              <div className="flex items-center">
                <FileIcon className="w-5 h-5 mr-2" />
                <span>{file.name}</span>
              </div>
            )}
          </div>
          <div>
            <Button
              onClick={removeImage}
              variant="destructive"
              disabled={isPending}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            "mb-6 border-dashed border-[#384EB7]/30 border-2 rounded-md py-[30px] flex flex-col items-center justify-center text-sm transition hover:border-[#384EB7] cursor-pointer",
            { active: isDragActive }
          )}
        >
          <input {...getInputProps()} />
          <Image
            src="/upload-icon.svg"
            height={0}
            width={0}
            alt="upload-icon"
            className="mb-[20px]"
            style={{
              width: "70px",
              height: "70px",
            }}
          />
          <div className="flex flex-col space-y-2 text-center">
            <p className="font-semibold text-[#0F0F0F]">
              Drag and drop files or{" "}
              <span className="text-[#483EA8] underline">Browse</span>
            </p>
            <p className="text-[12px] text-[#676767] px-2 md:px-0">
              Supported formats: {formats}
            </p>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
      )}
    </div>
  );
};





