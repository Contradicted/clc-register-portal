'use client'

import { format } from 'date-fns'
import { CalendarIcon, Loader2, LoaderCircle } from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormDescription,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { cn, formatStudyMode } from '@/lib/utils'
import { PhoneInput } from '@/components/ui/phone-input'
import { FormButtons } from './FormButtons'
import { FormError } from '@/components/FormError'
import { save } from '@/actions/save'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { MultiUploader } from '@/components/CustomUploader'
import { useMultiStepForm } from '@/hooks/useMultiStepForm'
import { SectionOneSchema } from '@/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import PlaceOfBirthInput from './PlaceOfBirthInput'

import countries from 'i18n-iso-countries'
import nationalities from "i18n-nationality";
import countriesEnglish from 'i18n-iso-countries/langs/en.json'
import nationalitiesEnglish from "i18n-nationality/langs/en.json";
import { popularCountries, popularNationalities } from "@/constants";
import { getActiveCourses } from '@/data/courses'
import { Label } from "@/components/ui/label";

countries.registerLocale(countriesEnglish);
nationalities.registerLocale(nationalitiesEnglish);

export const StepOneForm = ({
  activeCourses,
  application,
  userDetails,
  isFirstStep,
  nextStep,
  fData,
  updateData,
  savedQualifications,
  accumulatedFiles,
  deletedQualifications,
  deletedPendingQualifications,
  deletedWorkExperiences,
  setAccumulatedFiles,
}) => {
  const defaultIsClicked = application
    ? ![
        "",
        null,
        undefined,
        "Parents",
        "Family Members",
        "Employers",
        "Self",
        "Student Loan Company England (SLC)",
      ].includes(application.tuitionFees)
    : false;

  const [file, setFile] = useState(null);
  const [idFile, setIdFile] = useState(null);
  const [immigrationFile, setImmigrationFile] = useState(null);
  const [isClicked, setIsClicked] = useState(defaultIsClicked);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const [error, setError] = useState();
  const [hasError, setHasError] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);
  const [otherOptionText, setOtherOptionText] = useState(
    defaultIsClicked ? application?.tuitionFees : ""
  );
  const [isEntryDateRequired, setIsEntryDateRequired] = useState(
    (application?.countryOfBirth !== "United Kingdom" &&
      application?.nationality !== "British") ||
      false
  );
  const [isImmigrationRequired, setIsImmigrationRequired] = useState(false);
  const [isShareCodeRequired, setIsShareCodeRequired] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState(
    fData?.countryOfBirth || application?.countryOfBirth || ""
  );
  const [courses, setCourses] = useState([]);
  const [studyModes, setStudyModes] = useState([]);

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
      immigration_status: application?.immigration_status || undefined,
      share_code: application?.share_code || undefined,
      entryDateToUK: application?.entryDateToUK || undefined,
      identificationNo: application?.identificationNo || undefined,
      addressLine1:
        fData?.addressLine1 ||
        userDetails?.addressLine1 ||
        application?.addressLine1 ||
        undefined,
      addressLine2:
        fData?.addressLine2 ||
        userDetails?.addressLine2 ||
        application?.addressLine2 ||
        undefined,
      city: userDetails?.city || application?.city || undefined,
      postcode: userDetails?.postcode || application?.postcode || undefined,
      homeTelephoneNo:
        userDetails?.homeTelephoneNo ||
        application?.homeTelephoneNo ||
        undefined,
      mobileNo: userDetails?.mobileNo || application?.mobileNo || undefined,
      email: application?.email || undefined,
      tuitionFees: application?.tuitionFees || undefined,
    },
    resolver: zodResolver(SectionOneSchema),
  });

  const now = new Date();
  const { toast } = useToast();
  const router = useRouter();

  const watchCountryOfBirth = form.watch("countryOfBirth");
  const watchNationality = form.watch("nationality");
  const watchImmigrationStatus = form.watch("immigration_status");
  const watchCourseTitle = form.watch("courseTitle");

  const handlePlaceSelect = ({ placeOfBirth, countryName }) => {
    form.setValue("placeOfBirth", placeOfBirth);
    setDetectedCountry(countryName);
  };

  const onSubmit = (values) => {
    console.log("test");
  };

  const onNext = () => {
    setHasError(false);
    if (!file) {
      setIsRemoved(true);
    }
    const currentValues = form.getValues();

    const isValid = SectionOneSchema.safeParse(currentValues);

    if (!isValid.success) {
      console.log(isValid.error.formErrors.fieldErrors);
      setError(isValid.error.formErrors.fieldErrors);
      return;
    }

    if (currentValues.countryOfBirth !== detectedCountry) {
      setError("Please select the right country");
      return;
    }

    if (isClicked && !otherOptionText) {
      setError("Please specify how you will fund your studies.");
      setHasError(true);
      return;
    }

    if (currentValues.countryOfBirth === "United Kingdom") {
      currentValues.entryDateToUK = null;
    }

    if (currentValues.nationality === "British") {
      currentValues.immigration_status = null;
      currentValues.share_code = null;
    }

    if (currentValues.immigration_status === "settled") {
      currentValues.share_code = null;
    }

    updateData(
      {
        ...currentValues,
        tuitionFees: isClicked ? otherOptionText : currentValues.tuitionFees,
      },
      accumulatedFiles
    );
    nextStep(
      {
        ...currentValues,
        tuitionFees: isClicked ? otherOptionText : currentValues.tuitionFees,
      },
      accumulatedFiles
    );
  };

  useEffect(() => {
    if (application && application.photoUrl && !accumulatedFiles.file) {
      setIsLoading(true);
      try {
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
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
        console.error("Error loading file:", error);
      }
    }

    if (
      application &&
      application.identificationNoUrl &&
      !accumulatedFiles.idFile
    ) {
      setIsLoading(true);

      try {
        fetch(application.identificationNoUrl)
          .then((response) => response.blob())
          .then((blob) => {
            const file = new File([blob], application.identificationNo, {
              type: blob.type,
            });
            setIdFile(file);
            setAccumulatedFiles((prev) => ({
              ...prev,
              idFile: { file, alreadyExists: true },
            }));
          });

        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
        console.error("Error loading file:", error);
      }
    }
  }, [application, accumulatedFiles, setAccumulatedFiles]);

  useEffect(() => {
    if (
      application &&
      application.immigration_url &&
      !accumulatedFiles.immigrationFile
    ) {
      setIsLoading(true);

      try {
        fetch(application.immigration_url)
          .then((response) => response.blob())
          .then((blob) => {
            const file = new File([blob], application.immigration_name, {
              type: blob.type,
            });
            setImmigrationFile(file);
            setAccumulatedFiles((prev) => ({
              ...prev,
              immigrationFile: { file, alreadyExists: true },
            }));
          });
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
        console.error("Error loading file:", error);
      }
    }

    setIsLoading(false);
  }, [application, accumulatedFiles.immigrationFile, setAccumulatedFiles]);

  useEffect(() => {
    if (defaultIsClicked) {
      form.setValue("tuitionFees", "Other");
      setOtherOptionText(otherOptionText || "");
    }
  }, [form, defaultIsClicked, otherOptionText]);

  useEffect(() => {
    if (
      watchCountryOfBirth === "United Kingdom" &&
      watchNationality === "British"
    ) {
      setIsEntryDateRequired(false);
    } else if (
      (watchCountryOfBirth !== "United Kingdom" &&
        watchNationality === "British") ||
      (watchCountryOfBirth !== "United Kingdom" &&
        watchNationality !== "British")
    ) {
      setIsEntryDateRequired(true);
    } else {
      setIsEntryDateRequired(false);
    }
  }, [watchCountryOfBirth, watchNationality]);

  useEffect(() => {
    setIsImmigrationRequired(
      watchNationality !== "British" && watchNationality !== undefined
    );

    if (watchNationality === "British") {
      setAccumulatedFiles((prev) => ({
        ...prev,
        immigrationFile_isRemoved: true,
      }));
    }
  }, [watchNationality, setAccumulatedFiles]);

  useEffect(() => {
    setIsShareCodeRequired(
      watchImmigrationStatus !== "settled" &&
        watchImmigrationStatus !== undefined
    );
  }, [watchImmigrationStatus]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch("/api/courses");
        if (!response.ok) {
          throw new Error("Failed to fetch courses");
        }
        const data = await response.json();
        setCourses(data);

        // Find selected course and set study mode
        const selectedCourse = data.find(
          (course) => course.name === application?.courseTitle
        );
        if (selectedCourse) {
          setStudyModes(selectedCourse.course_study_mode);
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };
    fetchCourses();
  }, [application?.courseTitle]);

  useEffect(() => {
    const selectedCourse = courses.find(
      (course) => course.name === form.getValues("courseTitle")
    );
    if (selectedCourse) {
      setStudyModes(selectedCourse.course_study_mode);

      // Check if the current study mode is valid for the selected course
      const currentStudyMode = form.getValues("studyMode");
      const isValidStudyMode = selectedCourse.course_study_mode.some(
        (mode) => mode.study_mode === currentStudyMode
      );

      // Only reset the study mode if it's not valid for the selected course
      if (!isValidStudyMode) {
        form.setValue("studyMode", "");
      }
    } else {
      setStudyModes([]);
    }
  }, [watchCourseTitle, courses, form]);

  const saveForm = () => {
    setHasError(false);

    setError("");
    const stepOneData = form.getValues();

    if (isClicked && !otherOptionText) {
      setError("Please specify where you heard about us.");
      return;
    }

    if (stepOneData.countryOfBirth === "United Kingdom") {
      stepOneData.entryDateToUK = null;
    }

    if (stepOneData.nationality === "British") {
      stepOneData.immigration_status = null;
      stepOneData.share_code = null;
    }

    if (stepOneData.immigration_status === "settled") {
      stepOneData.share_code = null;
    }

    const currentValues = {
      ...fData,
      ...stepOneData,
      tuitionFees: isClicked ? otherOptionText : stepOneData.tuitionFees,
    };

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
        JSON.stringify(currentValues),
        deletedQualifications,
        deletedPendingQualifications,
        deletedWorkExperiences,
        formData
      ).then((data) => {
        if (data?.success) {
          toast({
            variant: "success",
            title: data.success,
          });

          router.push("/application-saved");
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
            <h1 className="font-semibold text-[18px] sm:text-[20px]">
              Course Details
            </h1>
            <span className="text-[12px] sm:text-[14px] text-[#929EAE]">
              Please enter details related to your course
            </span>
          </div>

          <div className="mt-5">
            <div className="flex flex-col sm:flex-row justify-center items-start gap-6 sm:gap-10 max-w-3xl mx-auto">
              <div className="w-full sm:w-1/2">
                <FormField
                  control={form.control}
                  name="courseTitle"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Course Title</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                          disabled={isPending}
                        >
                          <SelectTrigger
                            className={
                              form.formState.errors.courseTitle
                                ? "border-red-500"
                                : ""
                            }
                          >
                            <SelectValue placeholder="Select a course" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {courses.map((course) => (
                                <SelectItem
                                  className="w-full"
                                  key={course.id}
                                  value={course.name}
                                >
                                  {course.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="w-full sm:w-1/2">
                <FormField
                  control={form.control}
                  name="studyMode"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Study Mode</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                          disabled={isPending}
                        >
                          <SelectTrigger
                            className={
                              form.formState.errors.studyMode
                                ? "border-red-500"
                                : ""
                            }
                          >
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {studyModes.map((mode) => (
                                <SelectItem
                                  key={mode.id}
                                  value={mode.study_mode}
                                >
                                  {formatStudyMode(mode.study_mode)}
                                </SelectItem>
                              ))}
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
          <div className="flex flex-col text-left mt-8 sm:mt-[50px]">
            <h1 className="font-semibold text-[18px] sm:text-[20px]">
              Personal Details
            </h1>
            <span className="text-[12px] sm:text-[14px] text-[#929EAE]">
              Please enter your personal information
            </span>
          </div>

          <div className="mt-5 flex justify-center">
            <div className="w-full max-w-[1160px]">
              {/* Row 1 - Personal Details */}
              <div className="flex flex-wrap flex-col sm:flex-row justify-start items-start gap-6 sm:gap-10 sm:flex-nowrap">
                <div className="w-full sm:w-[290px]">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                            disabled={isPending}
                          >
                            <SelectTrigger
                              className={cn(
                                "lg:w-[290px]",
                                form.formState.errors.title && "border-red-500"
                              )}
                            >
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
                </div>
                <div className="w-full sm:w-[400px]">
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
                            className={cn(
                              "w-full",
                              form.formState.errors.firstName &&
                                "border-red-500"
                            )}
                            disabled={isPending}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="w-full sm:w-[400px]">
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
                            className={cn(
                              "w-full",
                              form.formState.errors.lastName && "border-red-500"
                            )}
                            disabled={isPending}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Row 2 - Profile Photo Upload */}
              <div className="mt-6">
                <Label className="underline">Profile Photo Upload</Label>
                <MultiUploader
                  onChange={(file, removed) => {
                    setFile(file);
                    setIsRemoved(removed);

                    const newAccumulatedFiles = {
                      ...accumulatedFiles,
                    };
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
                  fileType="image"
                />
              </div>

              {/* Row 3 */}
              <div className="flex flex-wrap flex-col sm:flex-row justify-start items-start gap-6 sm:gap-10 sm:flex-nowrap mt-6">
                <div className="w-full sm:w-[290px]">
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Gender</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                            disabled={isPending}
                          >
                            <SelectTrigger
                              className={cn(
                                "lg:w-[290px]",
                                form.formState.errors.gender && "border-red-500"
                              )}
                            >
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
                </div>
                <div className="w-full sm:w-[290px]">
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Popover>
                            <PopoverTrigger
                              asChild
                              className={
                                form.formState.errors.dateOfBirth &&
                                "border-red-500"
                              }
                            >
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
                                  field.onChange(new Date(date))
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
                <div className="w-full sm:w-[400px]">
                  <FormField
                    control={form.control}
                    name="placeOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Place of Birth (City/Town)</FormLabel>
                        <FormControl>
                          <PlaceOfBirthInput
                            {...field}
                            defaultValue={application?.placeOfBirth}
                            onPlaceSelect={handlePlaceSelect}
                            className={cn(
                              form.formState.errors.placeOfBirth &&
                                "border-red-500"
                            )}
                            disabled={isPending}
                          />
                        </FormControl>
                        {detectedCountry && field.value !== detectedCountry && (
                          <p className="text-yellow-500 text-sm absolute">
                            Detected country: {detectedCountry}
                          </p>
                        )}
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Row 4 */}
              <div className="flex flex-wrap flex-col sm:flex-row justify-start items-start gap-6 sm:gap-10 sm:flex-nowrap mt-6">
                <div className="w-full sm:w-[290px]">
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
                            <SelectTrigger
                              className={cn(
                                detectedCountry &&
                                  field.value !== detectedCountry &&
                                  "border-yellow-500"
                              )}
                            >
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>Popular Countries</SelectLabel>
                                {popularCountries.map((country) => (
                                  <SelectItem key={country} value={country}>
                                    {country}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                              <SelectSeparator />
                              <SelectGroup>
                                <SelectLabel>All Countries</SelectLabel>
                                {Object.entries(countries.getNames("en"))
                                  .filter(
                                    ([code, name]) =>
                                      !popularCountries.includes(name)
                                  )
                                  .map(([code, name]) => (
                                    <SelectItem key={code} value={name}>
                                      {name}
                                    </SelectItem>
                                  ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="w-full sm:w-[290px]">
                  <FormField
                    control={form.control}
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nationality</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              setIsImmigrationRequired(value !== "British");
                            }}
                            defaultValue={field.value}
                            value={field.value}
                            disabled={isPending}
                          >
                            <SelectTrigger
                              className={cn(
                                form.formState.errors.nationality &&
                                  "border-red-500"
                              )}
                            >
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>Popular Nationalities</SelectLabel>
                                {popularNationalities.map((nationality) => (
                                  <SelectItem
                                    key={nationality}
                                    value={nationality}
                                  >
                                    {nationality}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                              <SelectSeparator />
                              <SelectGroup>
                                <SelectLabel>All Countries</SelectLabel>
                                {Object.entries(nationalities.getNames("en"))
                                  .filter(
                                    ([code, nationality]) =>
                                      !popularNationalities.includes(
                                        nationality
                                      )
                                  )
                                  .sort((a, b) => a[1].localeCompare(b[1]))
                                  .map(([code, nationality]) => (
                                    <SelectItem key={code} value={nationality}>
                                      {nationality}
                                    </SelectItem>
                                  ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                {isEntryDateRequired && (
                  <div className="w-full sm:w-[290px]">
                    <FormField
                      control={form.control}
                      name="entryDateToUK"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Entry Date to UK</FormLabel>
                          <FormControl>
                            <Popover>
                              <PopoverTrigger
                                asChild
                                className={
                                  form.formState.errors.entryDateToUK &&
                                  "border-red-500"
                                }
                              >
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
                                    field.onChange(new Date(date))
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
                )}
              </div>

              {/* Row 5 */}
              <div className="flex flex-wrap flex-col sm:flex-row justify-start items-start gap-6 sm:gap-10 sm:flex-nowrap mt-6">
                {isImmigrationRequired && (
                  <>
                    <div className="w-full sm:w-[290px]">
                      <FormField
                        control={form.control}
                        name="immigration_status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Immigration Status</FormLabel>
                            <FormControl>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                value={field.value}
                                disabled={isPending}
                              >
                                <SelectTrigger
                                  className={cn(
                                    form.formState.errors.immigration_status &&
                                      "border-red-500"
                                  )}
                                >
                                  <SelectValue placeholder="Select an option" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    <SelectItem value="settled">
                                      Settled (Indefinite Leave)
                                    </SelectItem>
                                    <SelectItem value="pre_settled">
                                      Pre Settled (Limited Leave)
                                    </SelectItem>
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {isShareCodeRequired && (
                      <div className="w-full sm:w-[290px]">
                        <FormField
                          control={form.control}
                          name="share_code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Share Code</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="text"
                                  placeholder="Eg. XXX XXX XXX"
                                  className={cn(
                                    form.formState.errors.share_code &&
                                      "border-red-500"
                                  )}
                                  disabled={isPending}
                                  onChange={(e) => {
                                    const value = e.target.value
                                      .toUpperCase()
                                      .replace(/[^A-Z0-9]/g, "");
                                    const formattedValue = value
                                      .replace(/(.{3})/g, "$1 ")
                                      .trim();
                                    field.onChange(formattedValue);
                                  }}
                                  maxLength={11}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </>
                )}

                <div className="w-full sm:w-[400px]">
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
                            className={cn(
                              form.formState.errors.identificationNo &&
                                "border-red-500"
                            )}
                            disabled={isPending}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Row 6 */}
              {isImmigrationRequired && !isLoading && (
                <div className="mt-6 space-y-2">
                  <Label className="underline">
                    Immigration Document Upload
                  </Label>
                  <MultiUploader
                    onChange={(file, removed) => {
                      setImmigrationFile(file);
                      setIsRemoved(removed);

                      const newAccumulatedFiles = {
                        ...accumulatedFiles,
                      };
                      newAccumulatedFiles.immigrationFile = {
                        file,
                        alreadyExists: false,
                      };
                      setAccumulatedFiles(newAccumulatedFiles);
                    }}
                    defaultFile={
                      accumulatedFiles.immigrationFile?.file || immigrationFile
                    }
                    defaultPreviewUrl={
                      accumulatedFiles.immigrationFile?.alreadyExists
                        ? application?.immigration_url
                        : accumulatedFiles.immigrationFile?.file
                        ? URL.createObjectURL(
                            accumulatedFiles.immigrationFile.file
                          )
                        : null
                    }
                    isPending={isPending}
                    fileType="file"
                  />
                </div>
              )}

              {/* Row 7 */}
              {!isLoading && (
                <div className="mt-6 space-y-2">
                  <Label className="underline">
                    Passport / National ID Card Upload
                  </Label>
                  <MultiUploader
                    onChange={(file, removed) => {
                      setIdFile(file);
                      setIsRemoved(removed);

                      const newAccumulatedFiles = {
                        ...accumulatedFiles,
                      };
                      newAccumulatedFiles.idFile = {
                        file,
                        alreadyExists: false,
                      };
                      setAccumulatedFiles(newAccumulatedFiles);
                    }}
                    defaultFile={accumulatedFiles.idFile?.file || idFile}
                    defaultPreviewUrl={
                      accumulatedFiles.idFile?.alreadyExists
                        ? application?.identificationNoUrl
                        : accumulatedFiles.idFile?.file
                        ? URL.createObjectURL(accumulatedFiles.idFile.file)
                        : null
                    }
                    isPending={isPending}
                    fileType="image"
                  />
                </div>
              )}

              {/* Row 8 */}
              <div className="flex flex-wrap flex-col sm:flex-row justify-start items-start gap-6 sm:gap-10 sm:flex-nowrap mt-6">
                <div className="w-full sm:w-1/2">
                  <FormField
                    control={form.control}
                    name="addressLine1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 1</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            disabled={isPending}
                            className={
                              form.formState.errors.addressLine1 &&
                              "border-red-500"
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="w-full sm:w-1/2">
                  <FormField
                    control={form.control}
                    name="addressLine2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 2</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            disabled={isPending}
                            className={
                              form.formState.errors.addressLine2 &&
                              "border-red-500"
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Row 9 */}
              <div className="flex flex-wrap flex-col sm:flex-row justify-start items-start gap-6 sm:gap-10 sm:flex-nowrap mt-6">
                <div className="w-full">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Town/City</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            disabled={isPending}
                            className={
                              form.formState.errors.city && "border-red-500"
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="w-full">
                  <FormField
                    control={form.control}
                    name="postcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zip/Post code</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            disabled={isPending}
                            className={
                              form.formState.errors.postcode && "border-red-500"
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="w-full">
                  <FormField
                    control={form.control}
                    name="homeTelephoneNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Home Telephone No.</FormLabel>
                        <FormControl className="w-full">
                          <PhoneInput
                            {...field}
                            disabled={isPending}
                            hasError={!!form.formState.errors.mobileNo}
                            className={
                              form.formState.errors.homeTelephoneNo &&
                              "border-red-500"
                            }
                          />
                        </FormControl>
                        <FormDescription className="text-xs italic text-muted-foreground">
                          Select country code from dropdown or enter manually
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Row 10 */}
              <div className="flex flex-wrap flex-col sm:flex-row justify-start items-start gap-6 sm:gap-10 sm:flex-nowrap mt-6">
                <div className="w-full sm:w-[360px]">
                  <FormField
                    control={form.control}
                    name="mobileNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile No.</FormLabel>
                        <FormControl className="w-full">
                          <PhoneInput
                            {...field}
                            disabled={isPending}
                            formError={!!form.formState.errors.mobileNo}
                          />
                        </FormControl>
                        <FormDescription className="text-xs italic text-muted-foreground">
                          Select country code from dropdown or enter manually
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="w-full sm:w-[400px]">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            disabled={isPending}
                            className={
                              form.formState.errors.email && "border-red-500"
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Row 11 */}
              <div className="flex flex-wrap flex-col sm:flex-row justify-start items-start gap-6 sm:gap-10 sm:flex-nowrap mt-6">
                <div className="w-full">
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
                            onValueChange={(value) => {
                              field.onChange(value);
                              if (value === "Other") {
                                setIsClicked(true);
                              } else {
                                setIsClicked(false);
                                setOtherOptionText("");
                              }
                            }}
                            value={isClicked ? "Other" : field.value}
                            className="flex flex-col space-y-1"
                            disabled={isPending}
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0 mt-3">
                              <FormControl>
                                <RadioGroupItem value="Parents" />
                              </FormControl>
                              <FormLabel className="font-medium">
                                Parents
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Family Members" />
                              </FormControl>
                              <FormLabel className="font-medium">
                                Family Members
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Employers" />
                              </FormControl>
                              <FormLabel className="font-medium">
                                Employers
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Self" />
                              </FormControl>
                              <FormLabel className="font-medium">
                                Self
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Student Loan Company England (SLC)" />
                              </FormControl>
                              <FormLabel className="font-medium">
                                Student Loan Company England (SLC)
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem
                                  value="Other"
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
                                  onChange={(e) => {
                                    setOtherOptionText(e.target.value);
                                  }}
                                  value={otherOptionText}
                                  type="text"
                                  className={cn(
                                    "lg:max-w-[400px]",
                                    hasError && "border-red-500"
                                  )}
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
            isFirstStep={isFirstStep}
            isPending={isPending}
            onSave={saveForm}
            nextStep={onNext}
          />
        </form>
      </Form>
    </div>
  );
};
