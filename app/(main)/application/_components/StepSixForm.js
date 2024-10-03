import { useEffect, useRef, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { FormButtons } from './FormButtons'
import { FormError } from '@/components/FormError'
import { save } from '@/actions/save'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { submit } from '@/actions/submit'
import { useSession } from 'next-auth/react'
import { Checkbox } from '@/components/ui/checkbox'
import SignaturePad from 'react-signature-canvas'
import { SectionSixSchema } from '@/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils'
import { ExternalLink } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import Link from 'next/link'

export const StepSixForm = ({
  application,
  previousStep,
  isLastStep,
  fData,
  updateData,
  deletedQualifications,
  deletedPendingQualifications,
  deletedWorkExperiences,
  accumulatedFiles,
}) => {
  const defaultIsClicked = application
    ? ![
        "",
        undefined,
        null,
        "Newspaper/Magazine",
        "Relative/Friend",
        "Google",
        "Facebook",
        "Recruitment Agent",
      ].includes(fData?.marketing || application?.marketing)
    : false;
  const [isClicked, setIsClicked] = useState(defaultIsClicked);
  const [otherOptionText, setOtherOptionText] = useState(
    defaultIsClicked ? fData?.marketing || "" : ""
  );
  const [isRecruitmentAgent, setIsRecruitmentAgent] = useState(
    fData?.marketing === "Recruitment Agent" ||
      application?.marketing === "Recruitment Agent"
  );
  const [recruitmentAgentName, setRecruitmentAgentName] = useState(
    fData?.recruitmentAgentName || application?.recruitmentAgentName || ""
  );

  const [isPending, startTransition] = useTransition();
  const [isSubmitPending, startSubmitTransition] = useTransition();
  const [signature, setSignature] = useState(null);
  const [formErrors, setFormErrors] = useState();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState();

  const signatureRef = useRef(null);

  const { toast } = useToast();
  const router = useRouter();
  const { data: session, update } = useSession();

  const form = useForm({
    defaultValues: {
      marketing: fData?.marketing || application?.marketing || "",
      terms: fData?.terms || application?.terms || false,
    },
  });

  useEffect(() => {
    if (defaultIsClicked) {
      form.setValue("marketing", "Other");
      setOtherOptionText(fData?.marketing || application?.marketing || "");
    }
  }, [application, fData, form, defaultIsClicked]);

  useEffect(() => {
    if (isRecruitmentAgent) {
      form.setValue("marketing", "Recruitment Agent");
      setRecruitmentAgentName(
        fData?.recruitment_agent || application?.recruitment_agent || ""
      );
    }
  }, [isRecruitmentAgent, form, fData, application]);

  useEffect(() => {
    if (fData?.signature) {
      setSignature(fData.signature);
    } else if (application?.signatureUrl) {
      // Fetch the signature image and convert it to a data URL
      fetch(application.signatureUrl)
        .then((response) => response.blob())
        .then((blob) => {
          const reader = new FileReader();
          reader.onloadend = function () {
            setSignature(reader.result);
          };
          reader.readAsDataURL(blob);
        })
        .catch((error) => {
          console.error("Error loading signature:", error);
          // Handle the error, maybe set a flag to show an error message
        });
    }
  }, [fData, application]);

  useEffect(() => {
    if (signatureRef.current && signature) {
      signatureRef.current.fromDataURL(signature);
    }
  }, [signature]);

  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setSignature(null);
    }
  };

  const onSubmit = async () => {
    setError("");
    setFormErrors("");
    const stepSixData = form.getValues();

    const isValid = SectionSixSchema.safeParse(form.getValues());

    if (!isValid.success) {
      setFormErrors(isValid.error.formErrors.fieldErrors);
      return;
    }

    if (isClicked && !otherOptionText) {
      setFormErrors("Please specify where you heard about us.");
      return;
    }

    if (isRecruitmentAgent && !recruitmentAgentName.trim()) {
      setFormErrors("Please enter the name of the recruitment agent.");
      return;
    }

    setError("");
    setFormErrors("");

    if (!stepSixData.terms) {
      setFormErrors("Please agree to the terms and conditions.");
      return;
    }

    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      setFormErrors("Please sign the application form.");
      return;
    }

    setError("");
    setFormErrors("");

    const signatureData = signatureRef.current.toDataURL();

    const currentValues = {
      ...fData,
      ...stepSixData,
      marketing: isClicked ? otherOptionText : stepSixData.marketing,
      signature: signatureData !== signature ? signatureData : null,
      recruitment_agent: isRecruitmentAgent ? recruitmentAgentName : "",
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

    startSubmitTransition(() => {
      try {
        submit(
          JSON.stringify(currentValues),
          deletedQualifications,
          deletedWorkExperiences,
          formData
        ).then(async (data) => {
          if (data?.success) {
            toast({
              variant: "success",
              title: data.success,
            });
          }

          await update({
            ...session,
            user: {
              ...session.user,
              hasApplication: true,
            },
          });

          localStorage.setItem("refreshDashboard", "true");

          router.push("/dashboard");
        });
      } catch (error) {
        console.error("Error submitting application:", error);
        setError("An error occurred while submitting your application.");
      }
    });
  };

  const onPrevious = () => {
    setFormErrors("");
    const currentValues = form.getValues();

    const isValid = SectionSixSchema.safeParse(currentValues);

    if (!isValid.success) {
      setError(isValid.error.formErrors.fieldErrors);
      return;
    }

    if (isClicked && !otherOptionText) {
      setFormErrors("Please specify where you heard about us.");
      return;
    }

    if (isRecruitmentAgent && !recruitmentAgentName.trim()) {
      setFormErrors("Please enter the name of the recruitment agent.");
      return;
    }

    const signatureData =
      signatureRef.current && !signatureRef.current.isEmpty()
        ? signatureRef.current.toDataURL()
        : null;

    const updatedValues = {
      ...currentValues,
      marketing: isClicked ? otherOptionText : currentValues.marketing,
      signature: signatureData,
      recruitment_agent: isRecruitmentAgent ? recruitmentAgentName : "",
      // otherOptionText: isClicked ? otherOptionText : "",
    };

    updateData(updatedValues, accumulatedFiles);
    previousStep(updatedValues, accumulatedFiles);
  };

  const saveForm = async () => {
    if (isClicked && !otherOptionText) {
      setFormErrors("Please specify where you heard about us.");
      return;
    }

    if (isRecruitmentAgent && !recruitmentAgentName.trim()) {
      setFormErrors("Please enter the name of the recruitment agent.");
      return;
    }

    setError("");
    setFormErrors("");
    const stepSixData = form.getValues();

    const signatureData =
      signatureRef.current && !signatureRef.current.isEmpty()
        ? signatureRef.current.toDataURL()
        : null;

    const currentValues = {
      ...fData,
      ...stepSixData,
      marketing: isClicked ? otherOptionText : stepSixData.marketing,
      signature: signatureData,
      recruitment_agent: isRecruitmentAgent ? recruitmentAgentName : "",
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
            <h1 className="font-semibold text-[18px] sm:text-[20px]">
              Marketing Information
            </h1>
            <span className="text-[12px] sm:text-[14px] text-[#929EAE]">
              It would be helpful if you could kindly tell us where you heard
              about the City of London College by ticking the appropriate box
            </span>
          </div>

          <div className="mt-3 flex justify-center">
            <div className="w-full max-w-[1160px] space-y-6">
              <div className="w-full">
                <FormField
                  control={form.control}
                  name="marketing"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => {
                            field.onChange(value);
                            if (value === "Other") {
                              setIsClicked(true);
                              setIsRecruitmentAgent(false);
                            } else if (value === "Recruitment Agent") {
                              setIsClicked(false);
                              setIsRecruitmentAgent(true);
                            } else {
                              setIsClicked(false);
                              setIsRecruitmentAgent(false);
                            }

                            setOtherOptionText("");
                            setRecruitmentAgentName("");
                          }}
                          value={isClicked ? "Other" : field.value}
                          className={cn(
                            "flex flex-col space-y-1",
                            form.formState.errors.marketing && "border-red-500"
                          )}
                          disabled={isPending || isSubmitPending}
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0 mt-3">
                            <FormControl>
                              <RadioGroupItem value="Newspaper/Magazine" />
                            </FormControl>
                            <FormLabel className="font-medium">
                              Newspaper/Magazine
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Relative/Friend" />
                            </FormControl>
                            <FormLabel className="font-medium">
                              Relative/Friend
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Google" />
                            </FormControl>
                            <FormLabel className="font-medium">
                              Google
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Facebook" />
                            </FormControl>
                            <FormLabel className="font-medium">
                              Facebook
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Recruitment Agent" />
                            </FormControl>
                            <FormLabel className="font-medium">
                              Recruitment Agent
                            </FormLabel>
                          </FormItem>
                          {isRecruitmentAgent && (
                            <FormControl>
                              <Input
                                value={recruitmentAgentName}
                                type="text"
                                className="lg:max-w-[400px]"
                                placeholder="Enter the name of the recruitment agent"
                                onChange={(e) => {
                                  setRecruitmentAgentName(e.target.value);
                                }}
                              />
                            </FormControl>
                          )}
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem
                                value="Other"
                                checked={isClicked}
                                onClick={() => setIsClicked(true)}
                              />
                            </FormControl>
                            <FormLabel className="font-medium">Other</FormLabel>
                          </FormItem>
                          {isClicked && (
                            <FormControl>
                              <Input
                                value={otherOptionText}
                                type="text"
                                className={cn(
                                  "lg:max-w-[400px]",
                                  form.formState.errors.marketing &&
                                    "border-red-500"
                                )}
                                onChange={(e) => {
                                  setOtherOptionText(e.target.value);
                                }}
                              />
                            </FormControl>
                          )}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <div className="w-full space-y-6">
              <div className="flex flex-wrap flex-col sm:flex-row justify-start items-start gap-6 sm:gap-10 sm:flex-nowrap">
                <div className="w-full">
                  <FormField
                    control={form.control}
                    name="terms"
                    render={({ field }) => (
                      <FormItem className="items-center space-y-0 md:flex">
                        <FormControl>
                          <Checkbox
                            {...field}
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isPending || isSubmitPending}
                            className="mr-3"
                          />
                        </FormControl>
                        <FormLabel>
                          By ticking this box, you agree to the
                        </FormLabel>
                        <Dialog open={isOpen} onOpenChange={setIsOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="link"
                              className="p-0 h-auto text-black font-semibold flex items-center ml-1"
                            >
                              terms and conditions
                              <ExternalLink className="ml-1 size-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="w-[90vw] max-w-3xl max-h-[90vh] flex flex-col p-4 sm:p-6">
                            <DialogHeader>
                              <DialogTitle className="text-center text-lg sm:text-xl">
                                Terms and Conditions
                              </DialogTitle>
                            </DialogHeader>
                            <ScrollArea className="flex-grow overflow-auto mt-4">
                              <div className="text-xs sm:text-sm">
                                <h2 className="text-lg sm:text-2xl font-bold mb-2 sm:mb-4">
                                  Student Application and Tuition Fees
                                </h2>
                                <p className="mb-2 sm:mb-4">
                                  For detailed information about student
                                  application processes and tuition fees,
                                  including our refund and compensation policy,
                                  please refer to our official document:
                                </p>
                                <p className="mb-2 sm:mb-4">
                                  <Link
                                    href="https://www.clc-london.ac.uk/wp-content/uploads/003.-Tuition-Fee-Refunds-Compensation-Policy.pdf"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 underline"
                                  >
                                    Tuition Fee Refunds & Compensation Policy
                                    (PDF)
                                  </Link>
                                </p>
                                <p className="mb-2 sm:mb-4">
                                  This document outlines our policies regarding
                                  tuition fees, refunds, and potential
                                  compensation. We encourage all students to
                                  review this document carefully to understand
                                  their rights and responsibilities concerning
                                  financial matters related to their education
                                  at CLC.
                                </p>

                                <h2 className="text-lg sm:text-2xl font-bold mb-2 sm:mb-4">
                                  Student Charter
                                </h2>
                                <p className="mb-2 sm:mb-4">
                                  As a student of CLC, your expectations are
                                  rightly as high as your ambitions.
                                </p>

                                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4">
                                  Students can expect CLC to:
                                </h3>
                                <ul className="list-disc pl-6 mb-4 space-y-2">
                                  <li>
                                    treat them and colleagues equally and
                                    respectfully by adhering to the spirit of
                                    our code of equality and diversity;
                                  </li>
                                  <li>
                                    ensure a safe and secure study environment
                                    in accordance with the Health and Safety
                                    regulations;
                                  </li>
                                  <li>
                                    promote the spirit of mutual respect, order
                                    and decorum within the College environment
                                    and between students and staff;
                                  </li>
                                  <li>
                                    safeguard all personal information provided,
                                    in compliance with the requirements of the
                                    Data Protection Act and the Freedom of
                                    Information Act.
                                  </li>
                                </ul>

                                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4">
                                  The College aims to provide:
                                </h3>
                                <ul className="list-disc pl-6 mb-4 space-y-2">
                                  <li>
                                    a safe, productive and effective learning
                                    community in which students will have the
                                    opportunity to develop their career
                                    ambitions and fulfil their potential;
                                  </li>
                                  <li>
                                    an enhanced student experience through
                                    continual investment in our facilities and
                                    educational learning environment;
                                  </li>
                                  <li>
                                    appropriately high standards of teaching and
                                    assessment, support, advice and guidance and
                                    regular continuing professional development
                                    for its staff;
                                  </li>
                                  <li>
                                    a range of activities that will enhance
                                    employability and personal development;
                                  </li>
                                  <li>
                                    support for your engagement and
                                    participation in academic development and
                                    programme management, including elections of
                                    student representatives;
                                  </li>
                                  <li>
                                    access to sources of support such as
                                    counselling and advice on health and safety;
                                    accommodation; finance and careers;
                                  </li>
                                  <li>
                                    information about access to IT facilities,
                                    libraries and learning resources such as
                                    workshops, access to buildings and other
                                    services.
                                  </li>
                                </ul>

                                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4">
                                  As a student, you can expect:
                                </h3>
                                <ul className="list-disc pl-6 mb-4 space-y-2">
                                  <li>
                                    programme information which details key
                                    contacts, assessment criteria, contact hours
                                    and mode of delivery;
                                  </li>
                                  <li>
                                    with the exception of dissertations and
                                    exams, you will receive individual feedback
                                    on your assessed work within four weeks;
                                  </li>
                                  <li>
                                    that you will have regular timetabled
                                    opportunities to meet with your tutor;
                                  </li>
                                  <li>
                                    an induction to help familiarise you with
                                    the campus, introduce you to other students,
                                    and provide an introduction to your studies,
                                    available resources and key College
                                    contacts;
                                  </li>
                                  <li>
                                    student handbook covering your programme and
                                    module details such as assessment criteria,
                                    contact hours, mode of delivery of the
                                    programme, examination arrangements together
                                    with general College guidance on
                                    regulations, academic and pastoral support,
                                    appeals and complaints procedures
                                  </li>
                                  <li>
                                    payment options and deadlines and an
                                    estimate of all necessary additional costs
                                    such as materials, field trips and
                                    textbooks;
                                  </li>
                                  <li>
                                    communication channels to help keep you
                                    informed and to provide feedback
                                    opportunities regarding academic programmes
                                    and services;
                                  </li>
                                  <li>
                                    notice of changes to timetables in
                                    reasonable time through text message and
                                    email communication channels;
                                  </li>
                                  <li>
                                    clear deadlines for assignments and
                                    timeframes for feedback on submitted work in
                                    programme information;
                                  </li>
                                  <li>
                                    College information which details
                                    examination arrangements and regulations,
                                    academic guidance and support on appeals and
                                    complaints procedures.
                                  </li>
                                </ul>

                                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4">
                                  In return you are expected to:
                                </h3>
                                <ul className="list-disc pl-6 mb-4 space-y-2">
                                  <li>
                                    achieve near 100% attendance of your
                                    scheduled class and strive hard to achieve
                                    progression;
                                  </li>
                                  <li>
                                    commit to deadlines and manage your time
                                    effectively, ensuring that you submit
                                    assignments by agreed dates and that you own
                                    your work;
                                  </li>
                                  <li>
                                    be of good behaviour and treat staff and
                                    your fellow students equally and
                                    respectfully in line with the Student
                                    Handbook;
                                  </li>
                                  <li>
                                    take responsibility for managing your own
                                    learning, attend induction and actively
                                    engage in your programme;
                                  </li>
                                  <li>
                                    give full attention to all timetabled
                                    sessions and activities including all group
                                    tutorials;
                                  </li>
                                  <li>
                                    attend meetings with tutors, scheduled
                                    classes, submit assessed work by stated
                                    deadlines, actively participate in feedback
                                    received and ensure you spend sufficient
                                    regular time in private study;
                                  </li>
                                  <li>
                                    attend formal assessments at times
                                    determined by the College;
                                  </li>
                                  <li>
                                    have passion, drive and determination to
                                    achieve the best possible;
                                  </li>
                                  <li>
                                    inform the College of an absence due to
                                    medical reasons or other exceptional
                                    circumstances in accordance with the College
                                    attendance policy and programme-specific
                                    attendance policy;
                                  </li>
                                  <li>
                                    have a willingness to undertake independent
                                    study and research;
                                  </li>
                                  <li>
                                    engage with the information provided by the
                                    College taking full advantage of the
                                    services provided;
                                  </li>
                                  <li>
                                    understand the terms and conditions of being
                                    a CLC student and obligations regarding fees
                                    and payments;
                                  </li>
                                  <li>
                                    keep all your contact details up-to-date and
                                    inform the College immediately of any change
                                    in your contact details;
                                  </li>
                                  <li>
                                    respect the physical environment of the
                                    institution, including learning and social
                                    accommodation and behave respectfully
                                    towards our neighbours and as a responsible
                                    member of the local community;
                                  </li>
                                  <li>
                                    familiarise yourself with CLC policies and
                                    regulations including the regulations
                                    relating to the use of College&apos;s IS
                                    Computer and the Virtual Learning
                                    Environment (VLE).
                                  </li>
                                </ul>
                              </div>
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="relative w-auto lg:w-[800px] h-[200px] mt-6">
            <SignaturePad
              ref={signatureRef}
              canvasProps={{
                className:
                  "border border-[#9f9f9f] rounded-[5px] touch-none object-contain",
                style: {
                  height: "200px",
                  width: "100%",
                },
              }}
              disabled={isPending || isSubmitPending}
            />
            <Button
              type="button"
              size="sm"
              className="absolute top-2 right-2 z-10"
              onClick={clearSignature}
              disabled={isPending || isSubmitPending}
            >
              Clear
            </Button>
          </div>

          <FormButtons
            isPending={isPending}
            isSubmitPending={isSubmitPending}
            onSave={saveForm}
            onSubmit={onSubmit}
            previousStep={onPrevious}
            isLastStep={isLastStep}
          />
        </form>
      </Form>
    </div>
  );
};
