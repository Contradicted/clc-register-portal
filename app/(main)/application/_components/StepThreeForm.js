import { format } from "date-fns";
import { CalendarIcon, Plus, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  SectionThreeSchema,
  SectionTwoSavedSchema,
  SectionTwoSchema,
} from "@/schemas";

export const StepThreeForm = ({
  application,
  userDetails,
  previousStep,
  nextStep,
  fData,
  updateData,
  deletedQualifications,
  deletedPendingQualifications,
  deletedWorkExperiences,
  setDeletedWorkExperiences,
  accumulatedFiles,
  setAccumulatedFiles,
}) => {
  const [fileUploads, setFileUploads] = useState([]);
  const [isWorkExperienceClicked, setIsWorkExperienceClicked] = useState(
    (application?.workExperience?.length > 0 &&
      fData?.addWorkExperience !== "No") ||
      application?.hasWorkExperience
  );
  const [isPending, startTransition] = useTransition();
  const [formErrors, setFormErrors] = useState();
  const [error, setError] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [isRemoved, setIsRemoved] = useState({});

  const now = new Date();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      addWorkExperience:
        fData?.addWorkExperience === "Yes"
          ? "Yes"
          : fData?.addWorkExperience === "No"
          ? "No"
          : application?.hasWorkExperience === true
          ? "Yes"
          : application?.hasWorkExperience === false
          ? "No"
          : undefined,
      workExperience:
        application?.workExperience?.length > 0
          ? application.workExperience
          : [],
    },
    resolver: zodResolver(SectionThreeSchema),
  });

  const {
    fields: workExperienceFields,
    append: appendWorkExperience,
    update: updateWorkExperience,
    remove: removeWorkExperience,
  } = useFieldArray({
    control: form.control,
    name: "workExperience",
  });

  const handleDeleteWorkExperience = (index) => {
    const workExperience = form.getValues(`workExperience.${index}`);

    if (workExperience.id) {
      setDeletedWorkExperiences((prev) => [...prev, workExperience.id]);
    }
    removeWorkExperience(index);
    const newFileUploads = [...fileUploads];
    newFileUploads.splice(index, 1);
    setFileUploads(newFileUploads);
  };

  const handleFileChange = (index, file, removed) => {
    const newFileUploads = [...fileUploads];
    newFileUploads[index] = file;
    setFileUploads(newFileUploads);

    const updatedAccumulatedFiles = { ...accumulatedFiles };
    const updatedIsRemoved = { ...isRemoved };

    if (removed) {
      if (updatedAccumulatedFiles[`work_experience_file_${index}`]) {
        updatedAccumulatedFiles[`work_experience_file_${index}`].file = null;
      } else {
        updatedAccumulatedFiles[`work_experience_file_${index}`] = {
          file: null,
          alreadyExists: false,
        };
      }
      updatedAccumulatedFiles[`work_experience_file_${index}_isRemoved`] = true;
      updatedIsRemoved[`work_experience_file_${index}`] = true;
    } else {
      updatedAccumulatedFiles[`work_experience_file_${index}`] = {
        file,
        alreadyExists: false,
      };
      updatedAccumulatedFiles[
        `work_experience_file_${index}_isRemoved`
      ] = false;
      updatedIsRemoved[`work_experience_file_${index}`] = false;
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

    const isValid = SectionThreeSchema.safeParse(currentValues);

    if (!isValid.success) {
      setError(isValid.error.formErrors.fieldErrors);
      return;
    }

    if (
      currentValues.addWorkExperience === "No" ||
      currentValues.addWorkExperience === undefined
    ) {
      currentValues.workExperience = [];
    }

    updateData(currentValues, accumulatedFiles);
    previousStep(currentValues, accumulatedFiles);
  };

  const onNext = () => {
    const currentValues = form.getValues();

    const isValid = SectionThreeSchema.safeParse(currentValues);

    if (!isValid.success) {
      setError(isValid.error.formErrors.fieldErrors);
      return;
    }

    if (
      currentValues.addWorkExperience === "No" ||
      currentValues.addWorkExperience === undefined
    ) {
      currentValues.workExperience = [];
    }

    updateData(currentValues, accumulatedFiles);
    nextStep(currentValues, accumulatedFiles);
  };

  const saveForm = () => {
    setError("");
    setFormErrors("");
    const stepThreeData = form.getValues();

    const currentValues = { ...fData, ...stepThreeData };

    if (
      stepThreeData.addWorkExperience === "No" ||
      stepThreeData.addWorkExperience === undefined
    ) {
      currentValues.workExperience = [];
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

  const hasNoWorkExperienceFiles = () => {
    return !Object.keys(accumulatedFiles).some(
      (key) =>
        key.startsWith("work_experience_file_") &&
        !key.endsWith("_isRemoved") &&
        accumulatedFiles[key]?.file
    );
  };

  useEffect(() => {
    const updateFiles = async () => {
      if (
        application &&
        application.workExperience &&
        hasNoWorkExperienceFiles()
      ) {
        const updatedAccumulatedFiles = { ...accumulatedFiles };
        let updateState = false;

        const initialFileUploads = await Promise.all(
          application.workExperience.map(async (we, index) => {
            if (we.url) {
              try {
                const response = await fetch(we.url);
                const blob = await response.blob();
                const file = new File([blob], we.fileName, {
                  type: blob.type,
                });
                updatedAccumulatedFiles[`work_experience_file_${index}`] = {
                  file: file,
                  alreadyExists: true,
                };
                updateState = true;
                return we.url;
              } catch (error) {
                console.log("Something went wrong", error);
                return null;
              }
            }
            return (
              updatedAccumulatedFiles[`work_experience_file_${index}`]?.file ||
              null
            );
          })
        );

        if (updateState) {
          setFileUploads(initialFileUploads);
          setAccumulatedFiles(updatedAccumulatedFiles);

          application.workExperience.forEach((we, index) => {
            if (we.url) {
              updateWorkExperience(index, {
                ...we,
                file: initialFileUploads[index],
              });
            }
          });
        }
      }
      setIsLoading(false);
    };

    updateFiles();
  }, [application, updateWorkExperience, hasNoWorkExperienceFiles]);

  // useEffect(() => {
  //   if (
  //     isWorkExperienceClicked &&
  //     workExperienceFields.length === 0 &&
  //     !fData?.workExperience
  //   ) {
  //     appendWorkExperience({
  //       title: "",
  //       nameOfOrganisation: "",
  //       natureOfJob: "",
  //       jobStartDate: "",
  //       jobEndDate: "",
  //     });
  //   }
  // }, [
  //   isWorkExperienceClicked,
  //   workExperienceFields.length,
  //   appendWorkExperience,
  //   fData?.workExperience,
  // ]);

  return (
    <div className="w-full px-5 lg:px-[50px]">
      <FormError message={formErrors || error} />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-5">
          <div className="flex flex-col text-left">
            <h1 className="font-semibold text-[18px] sm:text-[20px]">
              Work Experience
            </h1>
            <span className="text-[12px] sm:text-[14px] text-[#929EAE]">
              Please enter details related to your work experience
            </span>
          </div>

          <div className="mt-5 flex justify-center">
            <div className="w-full max-w-[1160px]">
              <div className="flex flex-wrap flex-col sm:flex-row justify-start items-start gap-6 sm:gap-10 sm:flex-nowrap">
                <div className="w-full">
                  <FormField
                    control={form.control}
                    name="addWorkExperience"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex flex-col space-y-[5px]">
                          <FormLabel>
                            Do you have any work experience (paid/unpaid)?
                          </FormLabel>
                        </div>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => {
                              field.onChange(value);
                              setIsWorkExperienceClicked(value === "Yes");

                              if (value === "No") {
                                form.setValue("workExperience", []);
                              } else if (
                                value === "Yes" &&
                                workExperienceFields.length === 0
                              ) {
                                appendWorkExperience({
                                  title: "",
                                  nameOfOrganisation: "",
                                  natureOfJob: "",
                                  jobStartDate: "",
                                  jobEndDate: "",
                                });
                              }
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

              {isWorkExperienceClicked &&
                workExperienceFields.map((item, index) => (
                  <div key={item.id}>
                    <div className="flex flex-wrap flex-col sm:flex-row justify-start items-start gap-6 sm:gap-10 lg:flex-nowrap mt-6">
                      <div className="w-full sm:w-[400px]">
                        <FormField
                          control={form.control}
                          name={`workExperience.${index}.title`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Job Title</FormLabel>
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
                          name={`workExperience.${index}.nameOfOrganisation`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name of Organisation</FormLabel>
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
                          name={`workExperience.${index}.natureOfJob`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nature of Job</FormLabel>
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
                                    </SelectGroup>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div
                      key={item.id}
                      className="flex flex-wrap flex-col sm:flex-row justify-start items-start gap-6 sm:gap-10 sm:flex-nowrap mt-6"
                    >
                      <div className="w-full sm:w-[290px]">
                        <FormField
                          control={form.control}
                          name={`workExperience.${index}.jobStartDate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Job Start Date</FormLabel>
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
                      <div className="w-full sm:w-[290px]">
                        <FormField
                          control={form.control}
                          name={`workExperience.${index}.jobEndDate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Job End Date</FormLabel>
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
                                      disabled={(date) => {
                                        const jobStartDate = form.getValues(
                                          `workExperience.${index}.jobStartDate`
                                        );

                                        return (
                                          date < new Date(jobStartDate) ||
                                          date < new Date("1900-01-01")
                                        );
                                      }}
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
                        <div className="w-full sm:w-auto sm:self-end">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteWorkExperience(index)}
                            disabled={isPending}
                            className="w-full sm:w-auto mt-2 sm:mb-2"
                          >
                            <span className="sm:hidden">
                              Delete Work Experience
                            </span>
                            <X className="hidden sm:block size-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 w-full">
                      <FormField
                        control={form.control}
                        name={`workExperience.${index}.file`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Upload Work Experience File</FormLabel>
                            <MultiUploader
                              onChange={(file, removed) =>
                                handleFileChange(index, file, removed)
                              }
                              defaultFile={
                                !accumulatedFiles[
                                  `work_experience_file_${index}_isRemoved`
                                ]
                                  ? accumulatedFiles[
                                      `work_experience_file_${index}`
                                    ]?.file
                                  : null
                              }
                              defaultPreviewUrl={
                                accumulatedFiles[
                                  `work_experience_file_${index}_isRemoved`
                                ]
                                  ? null
                                  : accumulatedFiles[
                                      `work_experience_file_${index}`
                                    ]?.alreadyExists
                                  ? application?.workExperience &&
                                    application?.workExperience[index]?.url
                                  : accumulatedFiles[
                                      `work_experience_file_${index}`
                                    ]?.file
                                  ? URL.createObjectURL(
                                      accumulatedFiles[
                                        `work_experience_file_${index}`
                                      ]?.file
                                    )
                                  : null
                              }
                              isPending={isPending}
                              fileType="file"
                            />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}

              {isWorkExperienceClicked && workExperienceFields.length < 3 && (
                <Button
                  type="button"
                  variant="add"
                  disabled={isPending}
                  size="sm"
                  onClick={() =>
                    appendWorkExperience({
                      title: "",
                      nameOfOrganisation: "",
                      natureOfJob: "",
                      jobStartDate: "",
                      jobEndDate: "",
                    })
                  }
                  className="mb-10 mt-2"
                >
                  <Plus className="h-4 w-5" />
                  Add Work Experience
                </Button>
              )}
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
