import { format } from 'date-fns'
import { CalendarIcon, Plus, X } from 'lucide-react'
import { useCallback, useEffect, useState, useTransition } from "react";
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { save } from '@/actions/save'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { MultiUploader } from '@/components/CustomUploader'
import { FormError } from '@/components/FormError'
import { FormButtons } from './FormButtons'
import { cn } from '@/lib/utils'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { SectionTwoSavedSchema, SectionTwoSchema } from '@/schemas'

export const StepTwoForm = ({
    application,
    userDetails,
    previousStep,
    nextStep,
    fData,
    updateData,
    deletedQualifications,
    deletedPendingQualifications,
    deletedWorkExperiences,
    setDeletedQualifications,
    setDeletedPendingQualifications,
    accumulatedFiles,
    setAccumulatedFiles,
}) => {
    const [file, setFile] = useState(null)
    const [isPendingExamClicked, setIsPendingExamClicked] = useState(
        application?.pendingQualifications?.length > 0 &&
            fData?.addPendingQualifications !== 'No'
    )
    const [isClicked, setIsClicked] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [fileUploads, setFileUploads] = useState([])
    const [formErrors, setFormErrors] = useState()
    const [isRemoved, setIsRemoved] = useState({})
    const [error, setError] = useState()

    const now = new Date()
    const { toast } = useToast()
    const router = useRouter()

    // console.log(accumulatedFiles);

    const form = useForm({
      defaultValues: {
        qualifications:
          application?.qualifications?.length > 0
            ? application?.qualifications
            : [
                {
                  title: "" || undefined,
                  examiningBody: "" || undefined,
                  dateAwarded: "" || undefined,
                },
              ],
        addPendingQualifications:
          fData?.addPendingQualifications === "Yes"
            ? "Yes"
            : fData?.addPendingQualifications === "No"
            ? "No"
            : application?.hasPendingResults === true
            ? "Yes"
            : application?.hasPendingResults === false
            ? "No"
            : undefined,
        pendingQualifications:
          application?.pendingQualifications?.length > 0
            ? application.pendingQualifications
            : [
                {
                  title: "" || undefined,
                  examiningBody: "" || undefined,
                  dateOfResults: "",
                  subjectsPassed: "" || undefined,
                },
              ],
        isEnglishFirstLanguage:
          fData?.isEnglishFirstLanguage === "Yes"
            ? "Yes"
            : fData?.isEnglishFirstLanguage === "No"
            ? "No"
            : application?.isEnglishFirstLanguage === true
            ? "Yes"
            : application?.isEnglishFirstLanguage === false
            ? "No"
            : undefined,
      },
      resolver: zodResolver(SectionTwoSchema),
    });

    const {
      fields: qualificationFields,
      append: appendQualification,
      update: updateQualification,
      remove: removeQualification,
    } = useFieldArray({
      control: form.control,
      name: "qualifications",
    });

    const {
      fields: pendingQualificationFields,
      append: appendPendingQualification,
      update: updatePendingQualification,
      remove: removePendingQualification,
    } = useFieldArray({
      control: form.control,
      name: "pendingQualifications",
    });

    const handleDeleteQualification = (index) => {
      const qualification = form.getValues(`qualifications.${index}`);

      if (qualification.id) {
        setDeletedQualifications((prev) => [...prev, qualification.id]);
      }
      removeQualification(index);
      const newFileUploads = [...fileUploads];
      newFileUploads.splice(index, 1);
      setFileUploads(newFileUploads);
    };

    const handleDeletePendingQualification = (index) => {
      const pendingQualification = form.getValues(
        `pendingQualifications.${index}`
      );

      if (pendingQualification.id) {
        setDeletedPendingQualifications((prev) => [
          ...prev,
          pendingQualification.id,
        ]);
      }

      removePendingQualification(index);
    };

    const handleFileChange = (index, file, removed) => {
      const newFileUploads = [...fileUploads];
      newFileUploads[index] = file;
      setFileUploads(newFileUploads);

      const updatedAccumulatedFiles = { ...accumulatedFiles };
      const updatedIsRemoved = { ...isRemoved };

      if (removed) {
        if (updatedAccumulatedFiles[`qualification_file_${index}`]) {
          updatedAccumulatedFiles[`qualification_file_${index}`].file = null;
        } else {
          updatedAccumulatedFiles[`qualification_file_${index}`] = {
            file: null,
            alreadyExists: false,
          };
        }
        updatedAccumulatedFiles[`qualification_file_${index}_isRemoved`] = true;
        updatedIsRemoved[`qualification_file_${index}`] = true;
      } else {
        updatedAccumulatedFiles[`qualification_file_${index}`] = {
          file,
          alreadyExists: false,
        };
        updatedAccumulatedFiles[
          `qualification_file_${index}_isRemoved`
        ] = false;
        updatedIsRemoved[`qualification_file_${index}`] = false;
      }

      setAccumulatedFiles(updatedAccumulatedFiles);
      setIsRemoved(updatedIsRemoved);
    };

    const onSubmit = (values) => {
      console.log("foo", values);
    };

    const onPrevious = () => {
      setFormErrors("");
      const currentValues = form.getValues();

      if (
        currentValues.addPendingQualifications === "No" ||
        currentValues.addPendingQualifications === undefined
      ) {
        currentValues.pendingQualifications = [];
      }

      const isValid = SectionTwoSchema.safeParse(currentValues);

      if (!isValid.success) {
        setFormErrors(isValid.error.formErrors.fieldErrors);
        return;
      }

      updateData(currentValues, accumulatedFiles);
      previousStep(currentValues, accumulatedFiles);
    };

    const onNext = () => {
      const currentValues = form.getValues();

      const isValid = SectionTwoSchema.safeParse(currentValues);

      if (!isValid.success) {
        setFormErrors(isValid.error.formErrors.fieldErrors);
        return;
      }

      if (
        currentValues.addPendingQualifications === "No" ||
        currentValues.addPendingQualifications === undefined
      ) {
        currentValues.pendingQualifications = [];
      }

      updateData(currentValues, accumulatedFiles);
      nextStep(currentValues, accumulatedFiles);
    };

    const saveForm = () => {
      setError("");
      setFormErrors("");
      const stepTwoData = form.getValues();

      const currentValues = { ...fData, ...stepTwoData };

      if (stepTwoData.addPendingQualifications === "No") {
        currentValues.pendingQualifications = [];
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

      // Conditional validation logic
      const isValid = SectionTwoSavedSchema.safeParse(currentValues);

      if (!isValid.success) {
        console.log(isValid);
        setFormErrors(isValid.error.formErrors.fieldErrors);
        return;
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

    const hasNoQualificationFiles = useCallback(() => {
      return !Object.keys(accumulatedFiles).some(
        (key) =>
          key.startsWith("qualification_file_") &&
          !key.endsWith("_isRemoved") &&
          accumulatedFiles[key]?.file
      );
    }, [accumulatedFiles]);

    useEffect(() => {
      const updateFiles = async () => {
        if (
          application &&
          application.qualifications &&
          hasNoQualificationFiles()
        ) {
          const updatedAccumulatedFiles = { ...accumulatedFiles };

          const initialFileUploads = await Promise.all(
            application.qualifications.map(async (qual, index) => {
              if (qual.url) {
                try {
                  const response = await fetch(qual.url);
                  const blob = await response.blob();
                  const file = new File([blob], qual.fileName, {
                    type: blob.type,
                  });
                  updatedAccumulatedFiles[`qualification_file_${index}`] = {
                    file: file,
                    alreadyExists: true,
                  };
                  return qual.url;
                } catch (error) {
                  console.log("Something went wrong", error);
                  return null;
                }
              }
              return null;
            })
          );

          setFileUploads(initialFileUploads);
          setAccumulatedFiles(updatedAccumulatedFiles);

          application.qualifications.forEach((qual, index) => {
            if (qual.url) {
              updateQualification(index, {
                ...qual,
                file: initialFileUploads[index],
              });
            }
          });
        }

        if (application && application.pendingQualifications) {
          application.pendingQualifications.forEach((qual, index) => {
            updatePendingQualification(index, qual);
          });
        }
      };

      updateFiles();
    }, [
      application,
      updateQualification,
      updatePendingQualification,
      accumulatedFiles,
      setAccumulatedFiles,
      hasNoQualificationFiles,
    ]);

    console.log(accumulatedFiles);

    return (
      <div className="w-full px-5 lg:px-[50px]">
        <FormError message={formErrors || error} />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-5">
            <div className="flex flex-col text-left">
              <h1 className="font-semibold text-[18px] sm:text-[20px]">
                Qualifications
              </h1>
              <span className="text-[12px] sm:text-[14px] text-[#929EAE]">
                Please enter your qualifications achieved to date
              </span>
            </div>

            <div className="mt-5 flex justify-center">
              <div className="w-full max-w-[1160px]">
                {qualificationFields.map((item, index) => (
                  <>
                    <div
                      key={item.id}
                      className="flex flex-wrap flex-col sm:flex-row justify-start items-start gap-6 sm:gap-10 sm:flex-nowrap"
                    >
                      <div className="w-full sm:w-[400px]">
                        <FormField
                          control={form.control}
                          name={`qualifications.${index}.title`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Qualification Title</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="text"
                                  value={field.value}
                                  onChange={(e) =>
                                    field.onChange(e.target.value)
                                  }
                                  className={cn(
                                    form.formState.errors?.qualifications?.[
                                      index
                                    ]?.title && "border-red-500"
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
                          name={`qualifications.${index}.examiningBody`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Exam Body</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="text"
                                  value={field.value}
                                  onChange={(e) =>
                                    field.onChange(e.target.value)
                                  }
                                  className={cn(
                                    form.formState.errors?.qualifications?.[
                                      index
                                    ]?.examiningBody && "border-red-500"
                                  )}
                                  disabled={isPending}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="w-full sm:w-[290px]">
                        <FormField
                          control={form.control}
                          name={`qualifications.${index}.dateAwarded`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date Awarded</FormLabel>
                              <FormControl>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full justify-start text-left font-normal h-12 rounded-[10px] px-[25px]",
                                        !field.value && "text-muted-foreground",
                                        form.formState.errors?.qualifications?.[
                                          index
                                        ]?.dateAwarded && "border-red-500"
                                      )}
                                      disabled={isPending}
                                    >
                                      {field.value ? (
                                        format(
                                          new Date(field.value),
                                          "dd-MM-yyyy"
                                        )
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

                      {index > 0 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleDeleteQualification(index)}
                          className="w-full sm:w-fit sm:place-self-end sm:mb-2"
                        >
                          <span className="sm:hidden">
                            Delete Qualification
                          </span>
                          <X className="hidden sm:block size-4" />
                        </Button>
                      )}
                    </div>

                    {/* Row 2 */}
                    <div className="mt-6 w-full">
                      <FormField
                        control={form.control}
                        name={`qualifications.${index}.file`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="underline">
                              Upload Qualification File
                            </FormLabel>
                            <MultiUploader
                              onChange={(file, removed) =>
                                handleFileChange(index, file, removed)
                              }
                              defaultFile={
                                !accumulatedFiles[
                                  `qualification_file_${index}_isRemoved`
                                ]
                                  ? accumulatedFiles[
                                      `qualification_file_${index}`
                                    ]?.file
                                  : null
                              }
                              defaultPreviewUrl={
                                accumulatedFiles[
                                  `qualification_file_${index}_isRemoved`
                                ]
                                  ? null
                                  : accumulatedFiles[
                                      `qualification_file_${index}`
                                    ]?.alreadyExists
                                  ? application?.qualifications &&
                                    application?.qualifications[index]?.url
                                  : accumulatedFiles[
                                      `qualification_file_${index}`
                                    ]?.file
                                  ? URL.createObjectURL(
                                      accumulatedFiles[
                                        `qualification_file_${index}`
                                      ]?.file
                                    )
                                  : null
                                // (application?.qualifications &&
                                //   application?.qualifications[index]?.fileUrl) ||
                                // null
                              }
                              isPending={isPending}
                              fileType="file"
                            />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                ))}

                {qualificationFields.length < 3 && (
                  <Button
                    type="button"
                    variant="add"
                    size="sm"
                    disabled={isPending}
                    onClick={() =>
                      appendQualification({
                        title: "",
                        examiningBody: "",
                        dateAwarded: "",
                      })
                    }
                    className="mb-10 mt-2"
                  >
                    <Plus className="h-4 w-5" />
                    Add Qualification
                  </Button>
                )}

                <div className="flex flex-wrap flex-col sm:flex-row justify-start items-start gap-6 sm:gap-10 sm:flex-nowrap">
                  <div className="w-full">
                    <FormField
                      control={form.control}
                      name="addPendingQualifications"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex flex-col space-y-[5px]">
                            <FormLabel>
                              Do you have any pending qualifications/results?
                            </FormLabel>
                          </div>
                          <FormControl>
                            <RadioGroup
                              onValueChange={(value) => {
                                field.onChange(value);
                                setIsPendingExamClicked(value === "Yes");
                              }}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                              disabled={isPending}
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0 mt-3">
                                <FormControl>
                                  <RadioGroupItem value="Yes" />
                                </FormControl>
                                <FormLabel className="font-medium">
                                  Yes
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="No" />
                                </FormControl>
                                <FormLabel className="font-medium">
                                  No
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {isPendingExamClicked &&
                  pendingQualificationFields.map((item, index) => (
                    <>
                      <div
                        key={item.id}
                        className="flex flex-wrap flex-col sm:flex-row justify-start items-start gap-6 sm:gap-10 sm:flex-nowrap mt-6"
                      >
                        <div className="w-full sm:w-[400px]">
                          <FormField
                            control={form.control}
                            name={`pendingQualifications.${index}.title`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Qualification Title</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="text"
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
                            name={`pendingQualifications.${index}.examiningBody`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Exam Body</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="text"
                                    disabled={isPending}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="w-full sm:w-[290px]">
                          <FormField
                            control={form.control}
                            name={`pendingQualifications.${index}.dateOfResults`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Date of Results</FormLabel>
                                <FormControl>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant={"outline"}
                                        className={cn(
                                          "w-full justify-start text-left font-normal h-12 rounded-[10px] px-[25px]",
                                          !field.value &&
                                            "text-muted-foreground"
                                        )}
                                        disabled={isPending}
                                      >
                                        {field.value ? (
                                          format(
                                            new Date(field.value),
                                            "dd-MM-yyyy"
                                          )
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
                                          date <= new Date() ||
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

                      <div className="flex flex-wrap flex-col sm:flex-row justify-start items-start gap-6 sm:gap-10 sm:flex-nowrap mt-6">
                        <div className="w-full sm:w-[400px]">
                          <FormField
                            control={form.control}
                            name={`pendingQualifications.${index}.subjectsPassed`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Subjects Passed</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="text"
                                    disabled={isPending}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        {index > 0 && (
                          <div className="w-full sm:w-auto sm:self-end">
                            <Button
                              variant="destructive"
                              disabled={isPending}
                              size="sm"
                              onClick={() =>
                                handleDeletePendingQualification(index)
                              }
                              className="w-full sm:w-auto mt-2 sm:mb-2"
                            >
                              <span className="sm:hidden">
                                Delete Pending Qualification
                              </span>
                              <X className="hidden sm:block size-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </>
                  ))}

                {isPendingExamClicked &&
                  pendingQualificationFields.length < 3 && (
                    <Button
                      type="button"
                      variant="add"
                      size="sm"
                      onClick={() =>
                        appendPendingQualification({
                          title: "",
                          examiningBody: "",
                          dateAwarded: "",
                          subjectsPassed: "",
                        })
                      }
                      className="mb-10 mt-8"
                    >
                      <Plus className="h-4 w-5" />
                      Add Pending Qualification
                    </Button>
                  )}

                <div className="flex flex-wrap flex-col sm:flex-row justify-start items-start gap-6 sm:gap-10 sm:flex-nowrap mt-6">
                  <div className="w-full">
                    <FormField
                      control={form.control}
                      name="isEnglishFirstLanguage"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex flex-col space-y-[5px]">
                            <FormLabel>
                              Is English your first language?
                            </FormLabel>
                          </div>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                              disabled={isPending}
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0 mt-3">
                                <FormControl>
                                  <RadioGroupItem
                                    value="Yes"
                                    onClick={() => setIsClicked(false)}
                                  />
                                </FormControl>
                                <FormLabel className="font-medium">
                                  Yes
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem
                                    value="No"
                                    onClick={() => setIsClicked(false)}
                                  />
                                </FormControl>
                                <FormLabel className="font-medium">
                                  No
                                </FormLabel>
                              </FormItem>
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
              isPending={isPending}
              onSave={saveForm}
              nextStep={onNext}
              previousStep={onPrevious}
            />
          </form>
        </Form>
      </div>
    );
}
