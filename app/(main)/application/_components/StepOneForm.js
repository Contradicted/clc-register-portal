"use client";

import { format } from "date-fns";
import { CalendarIcon, Loader2, LoaderCircle } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PhoneInput } from "@/components/ui/phone-input";
import { FormButtons } from "./FormButtons";
import { FormError } from "@/components/FormError";
import { save } from "@/actions/save";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { MultiUploader } from "@/components/CustomUploader";
import { useMultiStepForm } from "@/hooks/useMultiStepForm";

export const StepOneForm = ({
  application,
  userDetails,
  nextStep,
  fData,
  updateData,
  savedQualifications,
  accumulatedFiles,
  deletedQualifications,
  deletedPendingQualifications,
  setAccumulatedFiles,
}) => {
  const defaultIsClicked = application
    ? ![
        "",
        "Parents",
        "Family Members",
        "Employers",
        "Self",
        "Student Loan Company England (SLC)",
      ].includes(application.tuitionFees)
    : false;

  const [file, setFile] = useState(null);
  const [isClicked, setIsClicked] = useState(defaultIsClicked);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const [error, setError] = useState();
  const [isRemoved, setIsRemoved] = useState(false);

  console.log("foo", fData);

  const form = useForm({
    defaultValues: {
      courseTitle: application?.courseTitle || undefined,
      studyMode: application?.studyMode || undefined,
      title: userDetails?.title || application?.title || undefined,
      firstName: userDetails?.firstName || application?.firstName || undefined,
      lastName: userDetails?.lastName || application?.lastName || undefined,
      gender: userDetails?.gender || application?.gender || undefined,
      dateOfBirth:
        userDetails?.dateOfBirth || application?.dateOfBirth || undefined,
      placeOfBirth: application?.placeOfBirth || undefined,
      countryOfBirth: application?.countryOfBirth || undefined,
      nationality: application?.nationality || undefined,
      entryDateToUK: application?.entryDateToUK || undefined,
      identificationNo: application?.identificationNo || undefined,
      addressLine1:
        userDetails?.addressLine1 || application?.addressLine1 || undefined,
      addressLine2:
        userDetails?.addressLine2 || application?.addressLine2 || undefined,
      city: userDetails?.city || application?.city || undefined,
      postcode: userDetails?.postcode || application?.postcode || undefined,
      homeTelephoneNo:
        userDetails?.homeTelephoneNo ||
        application?.homeTelephoneNo ||
        undefined,
      mobileNo: userDetails?.mobileNo || application?.mobileNo || undefined,
      email: application?.email || undefined,
      tuitionFees: application?.tuitionFees || "",
    },
  });

  const now = new Date();
  const { toast } = useToast();
  const router = useRouter();

  const onSubmit = (values) => {
    console.log("test");
  };

  const onNext = () => {
    if (!file) {
      setIsRemoved(true);
    }
    const currentValues = form.getValues();
    updateData(currentValues, accumulatedFiles);
    nextStep(currentValues, accumulatedFiles);
  };

  const onFileChange = (file, isRemoved) => {
    setFile(file);

    const newAccumulatedFiles = { ...accumulatedFiles };
    if (isRemoved) {
      delete newAccumulatedFiles.file;
      newAccumulatedFiles.isFileRemoved = true; // Track the removed state
    } else {
      newAccumulatedFiles.file = { file, alreadyExists: false };
      newAccumulatedFiles.isFileRemoved = false;
    }
    setAccumulatedFiles(newAccumulatedFiles);
  };

  useEffect(() => {
    if (application && application.photoUrl && !accumulatedFiles.file) {
      setIsLoading(true);
      fetch(application.photoUrl)
        .then((response) => response.blob())
        .then((blob) => {
          const file = new File([blob], application.photoName, {
            type: blob.type,
          });
          setFile(file);
          setAccumulatedFiles((prev) => ({
            ...prev,
            file: { file, alreadyExists: true },
          }));
        });
    }

    setIsLoading(false);
  }, [application]);

  const saveForm = () => {
    setError("");
    const currentValues = form.getValues();

    // Ensure date fields are converted to ISO strings
    if (currentValues.dateOfBirth) {
      currentValues.dateOfBirth = new Date(
        currentValues.dateOfBirth
      ).toISOString();
    }
    if (currentValues.entryDateToUK) {
      currentValues.entryDateToUK = new Date(
        currentValues.entryDateToUK
      ).toISOString();
    }

    const formData = new FormData();
    for (const key in accumulatedFiles) {
      if (accumulatedFiles[key]) {
        formData.append(key, accumulatedFiles[key].file);
        formData.append(
          `${key}_alreadyExists`,
          accumulatedFiles[key].alreadyExists
        );
      }
    }

    startTransition(() => {
      save(
        JSON.stringify({ ...fData, ...currentValues }),
        deletedQualifications,
        deletedPendingQualifications,
        formData
      ).then((data) => {
        if (data?.success) {
          toast({
            variant: "success",
            title: data.success,
          });

          router.push("/user-details");
        }

        if (data?.error) {
          setError(data.error);
        }
      });
    });
  };

  return (
    <div className="w-full px-5 lg:px-[50px]">
      <FormError message={error} />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-5">
          <div className="flex flex-col text-left">
            <h1 className="font-semibold text-[20px]">Course Details</h1>
            <span className="text-[14px] text-[#929EAE]">
              Please enter details related to your course
            </span>
          </div>

          <div className="lg:flex lg:justify-center mt-5">
            <div className="grid gap-10 sm:grid-cols-2">
              <div className="grid lg:w-[400px]">
                <FormField
                  control={form.control}
                  name="courseTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Title</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                          disabled={isPending}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a course" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="Higher National Certificate (HNC) in Business (level 4)">
                                Higher National Certificate (HNC) in Business
                                (level 4)
                              </SelectItem>
                              <SelectItem value="Higher National Diploma (HND) in Business (level 5)">
                                Higher National Diploma (HND) in Business (level
                                5)
                              </SelectItem>
                              <SelectItem value="Higher National Certificate (HNC) in Computing (level 4)">
                                Higher National Certificate (HNC) in Computing
                                (level 4)
                              </SelectItem>
                              <SelectItem value="Higher National Diploma (HND) in Computing (level 5)">
                                Higher National Diploma (HND) in Computing
                                (level 5)
                              </SelectItem>
                              <SelectItem value="Third Year (Top Up)">
                                Third Year (Top Up)
                              </SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="studyMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Study Mode</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                          disabled={isPending}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="Full-Time">
                                Full Time
                              </SelectItem>
                              <SelectItem value="Part-Time">
                                Part Time
                              </SelectItem>
                              <SelectItem value="Blended-Learning">
                                Blended Learning
                              </SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="flex flex-col text-left mt-[50px]">
            <h1 className="font-semibold text-[20px]">Personal Details</h1>
            <span className="text-[14px] text-[#929EAE]">
              Please enter your personal information
            </span>
          </div>

          <div className="w-full h-full lg:flex lg:flex-col lg:px-10 lg:items-center mt-5">
            <div>
              {/* Row 1 */}
              <div className="flex flex-col mb-10 lg:items-center gap-10 lg:flex-row">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                          disabled={isPending}
                        >
                          <SelectTrigger className="lg:w-[290px]">
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="Mr">Mr</SelectItem>
                              <SelectItem value="Mrs">Mrs</SelectItem>
                              <SelectItem value="Ms">Ms</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          className="lg:w-[400px]"
                          disabled={isPending}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          className="lg:w-[400px]"
                          disabled={isPending}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {!isLoading && (
                <MultiUploader
                  onChange={(file, removed) => {
                    setFile(file);
                    setIsRemoved(removed);

                    const newAccumulatedFiles = { ...accumulatedFiles };
                    newAccumulatedFiles.file = {
                      file,
                      alreadyExists: false,
                    };
                    setAccumulatedFiles(newAccumulatedFiles);
                  }}
                  defaultFile={accumulatedFiles.file?.file || file}
                  defaultPreviewUrl={
                    accumulatedFiles.file?.alreadyExists
                      ? application?.photoUrl
                      : accumulatedFiles.file?.file
                      ? URL.createObjectURL(accumulatedFiles.file.file)
                      : null
                  }
                  isPending={isPending}
                />
              )}

              {/* Row 2 */}
              <div className="flex flex-col mb-10 lg:items-center gap-10 lg:flex-row">
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                          disabled={isPending}
                        >
                          <SelectTrigger className="lg:w-[290px]">
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex flex-col gap-2 lg:w-[290px]">
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal h-12 rounded-[10px] px-[25px]",
                                  !field.value && "text-muted-foreground"
                                )}
                                disabled={isPending}
                              >
                                {field.value ? (
                                  format(new Date(field.value), "dd-MM-yyyy")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={new Date(field.value)}
                                captionLayout="dropdown-buttons"
                                fromYear={1920}
                                toYear={now.getFullYear()}
                                onSelect={(date) =>
                                  field.onChange(date.toISOString())
                                }
                                disabled={(date) =>
                                  date > new Date() ||
                                  date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="placeOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Place of Birth</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          className="lg:w-[400px]"
                          disabled={isPending}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 3 */}
              <div className="flex flex-col mb-10 lg:items-center gap-10 lg:flex-row">
                <FormField
                  control={form.control}
                  name="countryOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country of Birth</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                          disabled={isPending}
                        >
                          <SelectTrigger className="lg:w-[290px]">
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="United Kingdom">
                                United Kingdom
                              </SelectItem>
                              <SelectItem value="Spain">Spain</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex flex-col gap-2 lg:w-[290px]">
                  <FormField
                    control={form.control}
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nationality</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                            disabled={isPending}
                          >
                            <SelectTrigger className="lg:w-[290px]">
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectItem value="British">British</SelectItem>
                                <SelectItem value="Spanish">Spanish</SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex flex-col gap-2 lg:w-[290px]">
                  <FormField
                    control={form.control}
                    name="entryDateToUK"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entry Date to UK</FormLabel>
                        <FormControl>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal h-12 rounded-[10px] px-[25px]",
                                  !field.value && "text-muted-foreground"
                                )}
                                disabled={isPending}
                              >
                                {field.value ? (
                                  format(new Date(field.value), "dd-MM-yyyy")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={new Date(field.value)}
                                captionLayout="dropdown-buttons"
                                fromYear={1920}
                                toYear={now.getFullYear()}
                                onSelect={(date) =>
                                  field.onChange(date.toISOString())
                                }
                                disabled={(date) =>
                                  date > new Date() ||
                                  date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Row 4 */}
              <div className="flex flex-col mb-10 lg:items-center gap-10 lg:flex-row">
                <FormField
                  control={form.control}
                  name="identificationNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passport / National ID Card No.</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          className="lg:w-[400px]"
                          disabled={isPending}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 5 */}
              <div className="flex flex-col mb-10 lg:items-center gap-10 lg:flex-row">
                <div className="flex flex-col gap-2 w-full">
                  <FormField
                    control={form.control}
                    name="addressLine1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 1</FormLabel>
                        <FormControl>
                          <Input {...field} type="text" disabled={isPending} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <FormField
                    control={form.control}
                    name="addressLine2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 2</FormLabel>
                        <FormControl>
                          <Input {...field} type="text" disabled={isPending} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Row 6 */}
              <div className="flex flex-col mb-10 lg:items-center gap-10 lg:flex-row">
                <div className="flex flex-col gap-2 w-full">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Town/City</FormLabel>
                        <FormControl>
                          <Input {...field} type="text" disabled={isPending} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <FormField
                    control={form.control}
                    name="postcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zip/Post code</FormLabel>
                        <FormControl>
                          <Input {...field} type="text" disabled={isPending} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <FormField
                    control={form.control}
                    name="homeTelephoneNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Home Telephone No.</FormLabel>
                        <FormControl className="w-full">
                          <PhoneInput {...field} disabled={isPending} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Row 7 */}
              <div className="flex flex-col mb-10 lg:items-center gap-10 lg:flex-row">
                <div className="flex flex-col gap-2 lg:w-[363px]">
                  <FormField
                    control={form.control}
                    name="mobileNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile No.</FormLabel>
                        <FormControl className="w-full">
                          <PhoneInput {...field} disabled={isPending} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex flex-col gap-2 lg:w-[400px]">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="text" disabled={isPending} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Row 8 */}
              <div className="flex flex-col mb-10 lg:items-center gap-10 lg:flex-row">
                <div className="flex flex-col gap-2 w-full">
                  <FormField
                    control={form.control}
                    name="tuitionFees"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex flex-col space-y-[5px]">
                          <FormLabel>Tuition Fees</FormLabel>
                          <FormDescription>
                            How will you fund your studies?
                          </FormDescription>
                        </div>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-col space-y-1"
                            disabled={isPending}
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0 mt-3">
                              <FormControl>
                                <RadioGroupItem
                                  value="Parents"
                                  onClick={() => setIsClicked(false)}
                                />
                              </FormControl>
                              <FormLabel className="font-medium">
                                Parents
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem
                                  value="Family Members"
                                  onClick={() => setIsClicked(false)}
                                />
                              </FormControl>
                              <FormLabel className="font-medium">
                                Family Members
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem
                                  value="Employers"
                                  onClick={() => setIsClicked(false)}
                                />
                              </FormControl>
                              <FormLabel className="font-medium">
                                Employers
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem
                                  value="Self"
                                  onClick={() => setIsClicked(false)}
                                />
                              </FormControl>
                              <FormLabel className="font-medium">
                                Self
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem
                                  value="Student Loan Company England (SLC)"
                                  onClick={() => setIsClicked(false)}
                                />
                              </FormControl>
                              <FormLabel className="font-medium">
                                Student Loan Company England (SLC)
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem
                                  checked={isClicked}
                                  onClick={() => setIsClicked(true)}
                                />
                              </FormControl>
                              <FormLabel className="font-medium">
                                Other
                              </FormLabel>
                            </FormItem>
                            {isClicked && (
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ""}
                                  type="text"
                                  className="lg:max-w-[400px]"
                                />
                              </FormControl>
                            )}
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          <FormButtons
            isFirstStep
            isPending={isPending}
            onSave={saveForm}
            nextStep={onNext}
          />
        </form>
      </Form>
    </div>
  );
};
