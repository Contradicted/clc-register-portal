import { format } from "date-fns";
import { CalendarIcon, Plus, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { save } from "@/actions/save";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { MultiUploader } from "@/components/CustomUploader";
import { FormError } from "@/components/FormError";
import { FormButtons } from "./FormButtons";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SectionTwoSavedSchema, SectionTwoSchema } from "@/schemas";

export const StepTwoForm = ({
  application,
  userDetails,
  previousStep,
  nextStep,
  fData,
  updateData,
  deletedQualifications,
  setDeletedQualifications,
  deletedPendingQualifications,
  setDeletedPendingQualifications,
  accumulatedFiles,
  setAccumulatedFiles,
}) => {
  const [file, setFile] = useState(null);
  const [isPendingExamClicked, setIsPendingExamClicked] = useState(
    application?.pendingQualifications?.length > 0 &&
      fData?.addPendingQualifications !== "No"
  );
  const [isClicked, setIsClicked] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [fileUploads, setFileUploads] = useState([]);
  const [formErrors, setFormErrors] = useState();
  const [error, setError] = useState();

  const now = new Date();
  const { toast } = useToast();
  const router = useRouter();

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
          : application?.hasPendingResults
          ? "Yes"
          : !application?.hasPendingResults &&
            application?.hasPendingResults !== undefined
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

  const handleFileChange = (index, file) => {
    const newFileUploads = [...fileUploads];
    newFileUploads[index] = file;
    setFileUploads(newFileUploads);

    const updatedAccumulatedFiles = {
      ...accumulatedFiles,
      [`file_${index}`]: { file, alreadyExists: false },
    };
    setAccumulatedFiles(updatedAccumulatedFiles);
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

    const isValid = SectionTwoSavedSchema.safeParse(currentValues);

    if (!isValid.success) {
      console.log(isValid);
      setFormErrors(isValid.error.formErrors.fieldErrors);
      return;
    }

    updateData(currentValues, accumulatedFiles);
    previousStep(currentValues, accumulatedFiles);
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

  const onNext = () => {
    nextStep();
  };

  useEffect(() => {
    if (application && application.qualifications) {
      const initialFileUploads = application.qualifications.map(
        (qual, index) => {
          if (qual.fileUrl) {
            accumulatedFiles[`file_${index}`] = {
              file: "existing",
              alreadyExists: true,
            };
            return qual.fileUrl;
          }
          return null;
        }
      );
      setFileUploads(initialFileUploads);
      setAccumulatedFiles(accumulatedFiles);

      application.qualifications.forEach((qual, index) => {
        if (qual.fileUrl) {
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
  }, [application, updateQualification, updatePendingQualification]);

  return (
    <div className="w-full px-5 lg:px-[50px]">
      <FormError message={formErrors || error} />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-5">
          <div className="flex flex-col text-left">
            <h1 className="font-semibold text-[20px]">Qualifications</h1>
            <span className="text-[14px] text-[#929EAE]">
              Please enter your qualifications achieved to date
            </span>
          </div>

          <div className="w-full h-full lg:flex lg:flex-col lg:px-10 lg:items-center mt-5">
            <div>
              {qualificationFields.map((item, index) => (
                <div
                  key={item.id}
                  className="flex flex-col mb-10 lg:items-center gap-10 lg:flex-col w-full"
                >
                  <div className="flex flex-col lg:flex-row gap-4 w-full">
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
                              onChange={(e) => field.onChange(e.target.value)}
                              className="lg:w-[400px]"
                              disabled={isPending}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`qualifications.${index}.examiningBody`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Examining/Awarding Body</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="text"
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              className="lg:w-[400px]"
                              disabled={isPending}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <div className="flex flex-col gap-2 lg:w-[290px]">
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
                                      !field.value && "text-muted-foreground"
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
                        onClick={() => handleDeleteQualification(index)}
                        className="lg:place-self-end lg:mb-2"
                      >
                        <X className="size-4" />
                      </Button>
                    )}
                  </div>
                  <div className="w-full">
                    <FormField
                      control={form.control}
                      name={`qualifications.${index}.file`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Upload Qualification File</FormLabel>
                          <MultiUploader
                            onChange={(file) => handleFileChange(index, file)}
                            defaultFile={
                              accumulatedFiles[`file_${index}`]?.file ||
                              fileUploads[index]
                            }
                            defaultPreviewUrl={
                              (application?.qualifications &&
                                application?.qualifications[index]?.fileUrl) ||
                              null
                            }
                            isPending={isPending}
                          />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}

              {qualificationFields.length < 3 && (
                <Button
                  type="button"
                  variant="add"
                  size="sm"
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

              <div className="flex flex-col mb-10 lg:items-center gap-10 lg:flex-row">
                <div className="flex flex-col gap-2 w-full">
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
                              <FormLabel className="font-medium">Yes</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="No" />
                              </FormControl>
                              <FormLabel className="font-medium">No</FormLabel>
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
                  <div
                    key={item.id}
                    className="flex flex-col mb-10 lg:items-center gap-10 lg:flex-row flex-wrap"
                  >
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
                              className="lg:w-[400px]"
                              disabled={isPending}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`pendingQualifications.${index}.examiningBody`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Examining/Awarding Body</FormLabel>
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
                    <div className="flex flex-col gap-2 lg:w-[290px]">
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
                                      !field.value && "text-muted-foreground"
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
                              className="lg:w-[400px]"
                              disabled={isPending}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    {index > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeletePendingQualification(index)}
                        className="lg:place-self-end lg:mb-2"
                      >
                        <X className="size-4" />
                      </Button>
                    )}
                  </div>
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
                    className="mb-10 mt-2"
                  >
                    <Plus className="h-4 w-5" />
                    Add Pending Qualification
                  </Button>
                )}

              <div className="flex flex-col mb-10 lg:items-center gap-10 lg:flex-row">
                <div className="flex flex-col gap-2 w-full">
                  <FormField
                    control={form.control}
                    name="isEnglishFirstLanguage"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex flex-col space-y-[5px]">
                          <FormLabel>Is English your first language?</FormLabel>
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
                              <FormLabel className="font-medium">Yes</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem
                                  value="No"
                                  onClick={() => setIsClicked(false)}
                                />
                              </FormControl>
                              <FormLabel className="font-medium">No</FormLabel>
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
};
