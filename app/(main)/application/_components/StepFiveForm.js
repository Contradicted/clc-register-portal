import { useEffect, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { FormButtons } from './FormButtons'
import { FormError } from '@/components/FormError'
import { save } from '@/actions/save'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { submit } from '@/actions/submit'
import { DEFAULT_LOGIN_REDIRECT } from '@/routes'
import { currentUser } from '@/lib/auth'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useSession } from 'next-auth/react'
import { sendRecievedApplicationEmail } from '@/lib/mail'
import { ethnicities, religions } from "@/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { SectionFiveSchema } from "@/schemas";

export const StepFiveForm = ({
  application,
  previousStep,
  nextStep,
  isLastStep,
  fData,
  updateData,
  deletedQualifications,
  deletedPendingQualifications,
  deletedWorkExperiences,
  setDeletedWorkExperiences,
  accumulatedFiles,
  setAccumulatedFiles,
}) => {
  const listOfEthnicities = ethnicities.map((ethn) => ethn.value);
  const listOfReligions = religions.map((religion) => religion.value);

  const defaultIsEthnClicked = application
    ? !listOfEthnicities.includes(fData?.ethnicity || application?.ethnicity) &&
      !["", undefined, null].includes(
        fData?.ethnicity || application?.ethnicity
      )
    : false;
  const [isEthnClicked, setIsEthnClicked] = useState(defaultIsEthnClicked);
  const [otherEthnText, setOtherEthnText] = useState(
    defaultIsEthnClicked ? fData?.ethnicity || "" : ""
  );

  const defaultIsReligionClicked = application
    ? !listOfReligions.includes(fData?.religion || application?.religion) &&
      !["", undefined, null].includes(fData?.religion || application?.religion)
    : false;
  const [isReligionClicked, setIsReligionClicked] = useState(
    defaultIsReligionClicked
  );
  const [otherReligionText, setOtherReligionText] = useState(
    defaultIsReligionClicked ? fData?.religion || "" : ""
  );

  const [isPending, startTransition] = useTransition();
  const [isSubmitPending, startSubmitTransition] = useTransition();
  const [formErrors, setFormErrors] = useState();
  const [error, setError] = useState();

  const { toast } = useToast();
  const router = useRouter();
  const { data: session, update } = useSession();

  // console.log(isEthnClicked);

  const form = useForm({
    defaultValues: {
      ethnicity: fData?.ethnicity || application?.ethnicity || "",
      religion: fData?.religion || application?.religion || "",
    },
    resolver: zodResolver(SectionFiveSchema),
  });

  useEffect(() => {
    if (defaultIsEthnClicked) {
      form.setValue("ethnicity", "Other");
      setOtherEthnText(fData?.ethnicity || application?.ethnicity || "");
    }

    if (defaultIsReligionClicked) {
      form.setValue("religion", "Other");
      setOtherReligionText(fData?.religion || application?.religion || "");
    }
  }, [
    application,
    fData,
    form,
    defaultIsEthnClicked,
    defaultIsReligionClicked,
  ]);

  const onSubmit = () => {};

  const onPrevious = () => {
    setFormErrors("");
    const currentValues = form.getValues();

    const isValid = SectionFiveSchema.safeParse(currentValues);

    if (!isValid.success) {
      setError(isValid.error.formErrors.fieldErrors);
      return;
    }

    if (isEthnClicked && !otherEthnText) {
      setFormErrors(
        "Please select one of the options for ethnic origin or enter your own."
      );
      return;
    }

    if (isReligionClicked && !otherReligionText) {
      setFormErrors(
        "Please select one of the options for religion or enter your own."
      );
      return;
    }

    const updatedValues = {
      ...currentValues,
      ethnicity: isEthnClicked ? otherEthnText : currentValues.ethnicity,
      religion: isReligionClicked ? otherReligionText : currentValues.religion,
      // otherEthnText: isEthnClicked ? otherEthnText : "",
    };

    updateData(updatedValues, accumulatedFiles);
    previousStep(updatedValues, accumulatedFiles);
  };

  const onNext = () => {
    setFormErrors("");
    const currentValues = form.getValues();

    const isValid = SectionFiveSchema.safeParse(currentValues);

    if (!isValid.success) {
      setError(isValid.error.formErrors.fieldErrors);
      return;
    }

    if (isEthnClicked && !otherEthnText) {
      setFormErrors(
        "Please select one of the options for ethnic origin or enter your own."
      );
      return;
    }

    if (isReligionClicked && !otherReligionText) {
      setFormErrors(
        "Please select one of the options for religion or enter your own."
      );
      return;
    }

    const updatedValues = {
      ...currentValues,
      ethnicity: isEthnClicked ? otherEthnText : currentValues.ethnicity,
      religion: isReligionClicked ? otherReligionText : currentValues.religion,
      // otherEthnText: isEthnClicked ? otherEthnText : "",
    };

    updateData(updatedValues, accumulatedFiles);
    nextStep(updatedValues, accumulatedFiles);
  };

  const saveForm = () => {
    if (isEthnClicked && !otherEthnText) {
      setFormErrors(
        "Please select one of the options for ethnic origin or enter your own."
      );
      return;
    }

    if (isReligionClicked && !otherReligionText) {
      setFormErrors(
        "Please select one of the options for religion or enter your own."
      );
      return;
    }

    setError("");
    setFormErrors("");
    const stepFiveData = form.getValues();

    const currentValues = {
      ...fData,
      ...stepFiveData,
      ethnicity: isEthnClicked ? otherEthnText : stepFiveData.ethnicity,
      religion: isReligionClicked ? otherReligionText : stepFiveData.religion,
      // otherOptionText: isClicked ? otherOptionText : "",
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
      <FormError message={formErrors || error} />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-5">
          <div className="flex flex-col text-left">
            <h1 className="font-semibold text-[20px]">
              Equal Opportunities Monitoring
            </h1>
            <span className="text-[14px] text-[#929EAE]">
              Your response will not influence the outcome of your application.
              You do not have to answer this question if you do not wish.
            </span>
          </div>

          <div className="w-full h-full lg:flex lg:flex-col lg:px-10 mt-5">
            <div>
              <div className="flex flex-col mb-10 lg:items-center gap-10 lg:flex-row">
                <div className="flex flex-col gap-2 w-full space-y-4">
                  <FormField
                    control={form.control}
                    name="ethnicity"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => {
                              field.onChange(value);
                              console.log(value);
                              if (value === "Other") {
                                setIsEthnClicked(true);
                              } else {
                                setIsEthnClicked(false);
                                setOtherEthnText("");
                              }
                            }}
                            value={isEthnClicked ? "Other" : field.value}
                            className="grid grid-cols-1 space-y-2 space-x-3 md:grid-cols-2 lg:grid-cols-3"
                            disabled={isPending || isSubmitPending}
                          >
                            <FormLabel className="font-bold underline mb-1 col-span-full">
                              Ethnic origin
                            </FormLabel>
                            {ethnicities.map((ethn, index) => (
                              <FormItem
                                key={index}
                                className="flex items-center space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <RadioGroupItem value={ethn.value} />
                                </FormControl>
                                <FormLabel className="font-medium">
                                  {ethn.label}
                                </FormLabel>
                              </FormItem>
                            ))}
                            <div className="col-span-full">
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem
                                    value="Other"
                                    checked={isEthnClicked}
                                    onClick={() => setIsEthnClicked(true)}
                                  />
                                </FormControl>
                                <FormLabel className="font-medium">
                                  Other
                                </FormLabel>
                              </FormItem>
                              {isEthnClicked && (
                                <FormControl>
                                  <Input
                                    value={otherEthnText}
                                    type="text"
                                    className="mt-2 lg:max-w-[400px]"
                                    onChange={(e) => {
                                      setOtherEthnText(e.target.value);
                                    }}
                                  />
                                </FormControl>
                              )}
                            </div>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="religion"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => {
                              field.onChange(value);
                              if (value === "Other") {
                                setIsReligionClicked(true);
                              } else {
                                setIsReligionClicked(false);
                                setOtherReligionText("");
                              }
                            }}
                            value={isReligionClicked ? "Other" : field.value}
                            className="grid grid-cols-1 space-y-2 space-x-3 md:grid-cols-2 lg:grid-cols-3"
                            disabled={isPending || isSubmitPending}
                          >
                            <FormLabel className="font-bold underline mb-1 col-span-full">
                              Religion
                            </FormLabel>
                            {religions.map((religion, index) => (
                              <FormItem
                                key={index}
                                className="flex items-center space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <RadioGroupItem value={religion.value} />
                                </FormControl>
                                <FormLabel className="font-medium">
                                  {religion.label}
                                </FormLabel>
                              </FormItem>
                            ))}
                            <div className="col-span-full">
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem
                                    value="Other"
                                    checked={isReligionClicked}
                                    onClick={() => setIsReligionClicked(true)}
                                  />
                                </FormControl>
                                <FormLabel className="font-medium">
                                  Other
                                </FormLabel>
                              </FormItem>
                              {isReligionClicked && (
                                <FormControl>
                                  <Input
                                    value={otherReligionText}
                                    type="text"
                                    className="mt-2 lg:max-w-[400px]"
                                    onChange={(e) => {
                                      setOtherReligionText(e.target.value);
                                    }}
                                  />
                                </FormControl>
                              )}
                            </div>
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
            nextStep={onNext}
            onSave={saveForm}
            previousStep={onPrevious}
          />
        </form>
      </Form>
    </div>
  );
};
