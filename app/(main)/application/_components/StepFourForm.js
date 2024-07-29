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
import { SectionTwoSavedSchema, SectionTwoSchema } from "@/schemas";
import { Textarea } from "@/components/ui/textarea";

export const StepFourForm = ({
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
    application?.workExperience?.length > 0 && fData?.addWorkExperience !== "No"
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
      reasonsForChoosingProgram:
        application?.reasonsForChoosingProgram || undefined,
      futureEduPlans: application?.futureEduPlans || undefined,
      intentedEmployment: application?.intentedEmployment || undefined,
      hobbies: application?.hobbies || undefined,
      specialNeeds: application?.specialNeeds || undefined,
      stateBenefits: application?.stateBenefits || undefined,
      criminalRecord: application?.criminalRecord || undefined,
    },
  });

  const onSubmit = (values) => {
    console.log("foo", values);
  };

  const onPrevious = () => {
    setFormErrors("");
    const currentValues = form.getValues();

    updateData(currentValues, accumulatedFiles);
    previousStep(currentValues, accumulatedFiles);
  };

  const onNext = () => {
    const currentValues = form.getValues();

    updateData(currentValues, accumulatedFiles);
    nextStep(currentValues, accumulatedFiles);
  };

  const saveForm = () => {
    setError("");
    setFormErrors("");
    const stepFourData = form.getValues();

    const currentValues = { ...fData, ...stepFourData };

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

  // useEffect(() => {
  //   if (
  //     application &&
  //     application.workExperience &&
  //     hasNoWorkExperienceFiles()
  //   ) {
  //     const initialFileUploads = application.workExperience.map((we, index) => {
  //       if (we.fileUrl) {
  //         accumulatedFiles[`work_experience_file_${index}`] = {
  //           file: "existing",
  //           alreadyExists: true,
  //         };
  //         return we.fileUrl;
  //       }
  //       return null;
  //     });
  //     setFileUploads(initialFileUploads);
  //     setAccumulatedFiles(accumulatedFiles);

  //     application.workExperience.forEach((we, index) => {
  //       if (we.fileUrl) {
  //         updateWorkExperience(index, {
  //           ...we,
  //           file: initialFileUploads[index],
  //         });
  //       }
  //     });
  //   }

  //   setIsLoading(false);
  // }, [application, updateWorkExperience]);

  return (
    <div className="w-full px-5 lg:px-[50px]">
      <FormError message={formErrors || error} />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-5">
          <div className="flex flex-col text-left">
            <h1 className="font-semibold text-[20px]">Further Information</h1>
            <span className="text-[14px] text-[#929EAE]">
              Please use this section to tell us about yourself and your reasons
              for choosing to study this course
            </span>
          </div>

          <div className="w-full h-full lg:flex lg:flex-col lg:px-10 mt-5">
            <div>
              <div className="flex flex-col mb-10 lg:items-center gap-10 lg:flex-row">
                <div className="flex flex-col gap-2 w-full">
                  <FormField
                    control={form.control}
                    name="reasonsForChoosingProgram"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex flex-col space-y-[5px]">
                          <FormLabel>
                            Please give reasons for choosing this programme of
                            study
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Textarea
                            className="resize-none min-h-40"
                            disabled={isPending}
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="flex flex-col mb-10 lg:items-center gap-10 lg:flex-row">
                <div className="flex flex-col gap-2 w-full">
                  <FormField
                    control={form.control}
                    name="futureEduPlans"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex flex-col space-y-[5px]">
                          <FormLabel>
                            What are your future education plans?
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Textarea
                            className="resize-none min-h-40"
                            disabled={isPending}
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="flex flex-col mb-10 lg:items-center gap-10 lg:flex-row">
                <div className="flex flex-col gap-2 w-full">
                  <FormField
                    control={form.control}
                    name="intentedEmployment"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex flex-col space-y-[5px]">
                          <FormLabel>
                            What kind of employment do you intend to seek on
                            completion of your studies?
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Textarea
                            className="resize-none min-h-40"
                            disabled={isPending}
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="flex flex-col mb-10 lg:items-center gap-10 lg:flex-row">
                <div className="flex flex-col gap-2 w-full">
                  <FormField
                    control={form.control}
                    name="hobbies"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex flex-col space-y-[5px]">
                          <FormLabel>
                            Please write a brief statement about your interests
                            and hobbies
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Textarea
                            className="resize-none min-h-40"
                            disabled={isPending}
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="flex flex-col mb-10 lg:items-center gap-10 lg:flex-row">
                <div className="flex flex-col gap-2 w-full">
                  <FormField
                    control={form.control}
                    name="specialNeeds"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex flex-col space-y-[5px]">
                          <FormLabel>
                            To help us provide assistance where possible, please
                            state briefly if you have any special needs
                            requiring support of facilities
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Textarea
                            className="resize-none min-h-40"
                            disabled={isPending}
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="flex flex-col mb-10 lg:items-center gap-10 lg:flex-row">
                <div className="flex flex-col gap-2 w-full">
                  <FormField
                    control={form.control}
                    name="stateBenefits"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex flex-col space-y-[5px]">
                          <FormLabel>
                            Are you currently on any state benefits? If so,
                            please explain the type of benefits
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Textarea
                            className="resize-none min-h-40"
                            disabled={isPending}
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="flex flex-col mb-10 lg:items-center gap-10 lg:flex-row">
                <div className="flex flex-col gap-2 w-full">
                  <FormField
                    control={form.control}
                    name="criminalRecord"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex flex-col space-y-[5px]">
                          <FormLabel>
                            Do you have any criminal record(s) within or outside
                            the UK? If yes, please state
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Textarea
                            className="resize-none min-h-40"
                            disabled={isPending}
                            {...field}
                          />
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