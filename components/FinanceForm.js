"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  PencilIcon,
  Plus,
  Trash,
  FileIcon,
  ExternalLinkIcon,
  CheckCircleIcon,
  CalendarIcon,
  Loader2Icon,
} from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { updateFinance } from "@/actions/update-finance";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import AmountInput from "@/components/amount-input";
import { RadioGroup, RadioGroupItem, Label } from "@/components/ui/radio-group";
import { FinanceInfoSchema } from "@/schemas";
import { MultiUploader } from "./CustomUploader";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";

export const FinanceForm = ({ data, courses }) => {
  const defaultIsClicked = data
    ? ![
        "",
        null,
        undefined,
        "Parents",
        "Family Members",
        "Employers",
        "Self",
        "Student Loan Company England (SLC)",
      ].includes(data.tuitionFees)
    : false;
  const [isCreatingPaymentPlan, setIsCreatingPaymentPlan] = useState(false);
  const [selectedCourseFee, setSelectedCourseFee] = useState(
    data?.paymentPlan?.courseFee ||
      data?.course?.course_study_mode?.find(
        (mode) => mode.study_mode === data.studyMode
      )?.tuition_fees ||
      0
  );
  const [useMaintenanceForTuition, setUseMaintenanceForTuition] = useState(
    data?.paymentPlan?.usingMaintenanceForTuition
  );
  const [feeDifference, setFeeDifference] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState({
    difference: data?.paymentPlan?.difference || 0,
    insufficientTuition: false,
    insufficientMaintenance: false,
  });
  const [isClicked, setIsClicked] = useState(defaultIsClicked);
  const [otherOptionText, setOtherOptionText] = useState(
    defaultIsClicked ? data?.tuitionFees : ""
  );
  const [slcSelected, setSlcSelected] = useState(
    data?.tuitionFees === "Student Loan Company England (SLC)"
  );
  const [hasError, setHasError] = useState(false);
  const [tuitionFile, setTuitionFile] = useState(null);
  const [isPending, setIsPending] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [isSubmitting, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(FinanceInfoSchema),
    defaultValues: {
      courseTitle: data?.courseTitle || undefined,
      tuitionFees: data?.tuitionFees || undefined,
      hasSlcAccount:
        data?.paymentPlan?.hasSlcAccount === true
          ? "Yes"
          : data?.paymentPlan?.hasSlcAccount === false
          ? "No"
          : undefined,
      previouslyReceivedFunds:
        data?.paymentPlan?.previouslyReceivedFunds === true
          ? "Yes"
          : data?.paymentPlan?.previouslyReceivedFunds === false
          ? "No"
          : undefined,
      previousFundingYear: data?.paymentPlan?.previousFundingYear || undefined,
      appliedForCourse:
        data?.paymentPlan?.appliedForCourse === true
          ? "Yes"
          : data?.paymentPlan?.appliedForCourse === false
          ? "No"
          : undefined,
      crn: data?.paymentPlan?.crn?.trim() || undefined,
      slcStatus: data?.paymentPlan?.slcStatus || undefined,
      tuitionFeeAmount: data?.paymentPlan?.tuitionFeeAmount || undefined,
      maintenanceLoanAmount:
        data?.paymentPlan?.maintenanceLoanAmount || undefined,
      ssn: data?.paymentPlan?.ssn || undefined,
      expectedPayments: data?.paymentPlan?.expectedPayments || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "expectedPayments",
  });

  const watchSlcStatus = form.watch("slcStatus");
  const tuitionFeeAmount = form.watch("tuitionFeeAmount");
  const maintenanceLoanAmount = form.watch("maintenanceLoanAmount");

  const courseTitle = form.watch("courseTitle");

  const createPaymentPlan = (amount, numberOfPayments = 2) => {
    const paymentAmount = Number((amount / numberOfPayments).toFixed(2));
    const remainder = Number(
      (amount - paymentAmount * (numberOfPayments - 1)).toFixed(2)
    );

    return Array(numberOfPayments)
      .fill(null)
      .map((_, index) => ({
        date: undefined,
        amount: index === numberOfPayments - 1 ? remainder : paymentAmount,
        university: "Plymouth Marjon University",
        course: courseTitle || "",
      }));
  };

  const onSubmit = async (values) => {
    try {
      setIsPending(true);

      // Calculate shortfall if tuition fee amount is less than course fee
      let shortfall = null;
      if (
        selectedCourseFee &&
        values.tuitionFeeAmount &&
        values.tuitionFeeAmount < selectedCourseFee
      ) {
        shortfall = {
          type: "tuition",
          amount: selectedCourseFee - values.tuitionFeeAmount,
          courseFee: selectedCourseFee,
          approvedAmount: values.tuitionFeeAmount,
          status: values.slcStatus,
        };
      }

      // Create FormData object
      const formData = new FormData();

      // Add all form values except arrays and special fields
      Object.entries(values).forEach(([key, value]) => {
        if (
          !Array.isArray(value) &&
          key !== "expectedPayments" &&
          key !== "tuitionDoc"
        ) {
          if (key === "tuitionFeeAmount" || key === "maintenanceLoanAmount") {
            formData.append(key, value ? String(value) : "");
          } else if (key === "tuitionFees") {
            // Handle the "Other" option for tuition fees
            const tuitionFeesValue =
              value === "Other" ? otherOptionText : value;
            formData.append(key, tuitionFeesValue);
          } else if (typeof value === "number") {
            formData.append(key, String(value));
          } else if (value instanceof Date) {
            formData.append(key, value.toISOString());
          } else if (value !== undefined && value !== null) {
            formData.append(key, value);
          }
        }
      });

      // Handle expectedPayments array
      const payments =
        values.expectedPayments?.map((payment) => ({
          date:
            payment.date instanceof Date
              ? payment.date.toISOString()
              : payment.date,
          amount:
            typeof payment.amount === "string"
              ? Number(payment.amount)
              : payment.amount,
          university: payment.university || "",
          course: payment.course || "",
        })) || [];

      formData.append("expectedPayments", JSON.stringify(payments));

      // Add additional data
      formData.append("courseFee", String(selectedCourseFee));
      if (
        paymentStatus.insufficientTuition ||
        paymentStatus.insufficientMaintenance
      ) {
        formData.append("paymentStatus", JSON.stringify(paymentStatus));
      }

      // Add file if it exists and has changed
      if (tuitionFile) {
        formData.append("tuitionDoc", tuitionFile);
        formData.append(
          "alreadyExists",
          data?.tuition_doc_url ? "true" : "false"
        );
      }

      // Handle file deletion
      if (!tuitionFile && data?.tuition_doc_url) {
        formData.append("deleteExistingTuitionDoc", "true");
      }

      console.log("File being sent:", tuitionFile);
      console.log("FormData entries:");
      for (let [key, value] of formData.entries()) {
        console.log(key, value instanceof File ? `File: ${value.name}` : value);
      }

      startTransition(() => {
        updateFinance(formData).then((data) => {
          if (data?.error) {
            toast({
              title: "Error",
              description: data.error,
              variant: "destructive",
            });
            return;
          }

          if (data?.success) {
            toast({
              title: "Success",
              variant: "success",
              description: data.success,
            });
            setIsEditing(false);
            router.refresh();
          }
        });
      });

      router.refresh();
    } catch (error) {
      console.error("FINANCE_FORM_ERROR", error);
      toast({
        title: "Error",
        description: "Something went wrong!",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  useEffect(() => {
    if (!selectedCourseFee || !watchSlcStatus?.includes("Tuition Fees")) return;

    const tuition = Number(tuitionFeeAmount);
    const maintenance = Number(maintenanceLoanAmount);
    const total = tuition + (useMaintenanceForTuition ? maintenance : 0);
    const difference = selectedCourseFee - total;

    setPaymentStatus({
      difference,
      insufficientTuition: difference > 0,
      insufficientMaintenance: maintenance > 0 && maintenance < difference,
    });
  }, [
    selectedCourseFee,
    watchSlcStatus,
    tuitionFeeAmount,
    maintenanceLoanAmount,
    useMaintenanceForTuition,
  ]);

  useEffect(() => {
    if (data && data.tuition_doc_url) {
      try {
        fetch(data.tuition_doc_url)
          .then((response) => response.blob())
          .then((blob) => {
            const file = new File([blob], data.tuition_doc_name, {
              type: blob.type,
            });
            setTuitionFile(file);
          });
      } catch (error) {
        console.error("Error loading tuition document:", error);
      }
    }
  }, [data]);

  useEffect(() => {
    if (defaultIsClicked) {
      form.setValue("tuitionFees", "Other");
    }
  }, [defaultIsClicked, form]);

  console.log(form.formState.errors);

  return (
    <div className="w-full lg:max-w-screen-lg mx-auto">
      <div className="border border-stroke rounded-md w-full p-6">
        <div className="flex justify-between mb-6">
          <h2 className="text-2xl font-semibold">Finance Information</h2>
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              size="sm"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>

        {!isEditing ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="min-w-0">
                <h4 className="font-medium mb-2 text-base">Tuition Fees</h4>
                <p className="text-sm">
                  {data?.tuitionFees || "Not specified"}
                </p>
              </div>

              {data?.tuitionFees === "Student Loan Company England (SLC)" && (
                <>
                  {data?.paymentPlan?.hasSlcAccount !== null && (
                    <div className="min-w-0">
                      <h4 className="font-medium mb-2 text-base">
                        Do you have an account with the Student Loan Company
                        (SLC)?
                      </h4>
                      <p className="text-sm">
                        {data?.paymentPlan?.hasSlcAccount ? "Yes" : "No"}
                      </p>
                    </div>
                  )}
                  {data?.paymentPlan?.previouslyReceivedFunds !== null && (
                    <div className="min-w-0">
                      <h4 className="font-medium mb-2 text-base">
                        Has previously received funds from Student Finance
                        England?
                      </h4>
                      <p className="text-sm">
                        {data?.paymentPlan?.previouslyReceivedFunds
                          ? "Yes"
                          : "No"}
                      </p>
                    </div>
                  )}
                  {data?.paymentPlan?.previousFundingYear && (
                    <div className="min-w-0">
                      <h4 className="font-medium mb-2 text-base">
                        Previous Funding Year
                      </h4>
                      <p className="text-sm">
                        {data?.paymentPlan?.previousFundingYear ||
                          "Not specified"}
                      </p>
                    </div>
                  )}
                  {data?.paymentPlan?.appliedForCourse !== null && (
                    <div className="min-w-0">
                      <h4 className="font-medium mb-2 text-base">
                        Have you applied for SLC funding for this course?
                      </h4>
                      <p className="text-sm">
                        {data?.paymentPlan?.appliedForCourse ? "Yes" : "No"}
                      </p>
                    </div>
                  )}
                  {data?.paymentPlan?.crn && (
                    <div className="min-w-0">
                      <h4 className="font-medium mb-2 text-base">CRN</h4>
                      <p className="text-sm">
                        {data?.paymentPlan?.crn || "Not specified"}
                      </p>
                    </div>
                  )}
                  {data?.paymentPlan?.slcStatus && (
                    <div className="min-w-0">
                      <h4 className="font-medium mb-2 text-base">SLC Status</h4>
                      <p className="text-sm">
                        {data?.paymentPlan?.slcStatus || "Not specified"}
                      </p>
                    </div>
                  )}
                  {data?.paymentPlan?.tuitionFeeAmount && (
                    <div className="min-w-0">
                      <h4 className="font-medium mb-2 text-base">
                        Tuition Fee Amount
                      </h4>
                      <p className="text-sm">
                        {data?.paymentPlan?.tuitionFeeAmount
                          ? formatCurrency(data.paymentPlan.tuitionFeeAmount)
                          : "Not specified"}
                      </p>
                    </div>
                  )}
                  {data?.paymentPlan?.maintenanceLoanAmount && (
                    <div className="min-w-0">
                      <h4 className="font-medium mb-2 text-base">
                        Maintenance Loan Amount
                      </h4>
                      <p className="text-sm">
                        {data?.paymentPlan?.maintenanceLoanAmount
                          ? formatCurrency(
                              data.paymentPlan.maintenanceLoanAmount
                            )
                          : "Not specified"}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Always stack these sections vertically */}
            <div className="w-[calc(100vw-3rem)] sm:w-full -mx-4 sm:mx-0 px-4 sm:px-0">
              {data?.paymentPlan?.expectedPayments?.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium mb-4">Expected Payments</h4>
                  <div className="hidden md:block border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse min-w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="px-4 py-3 text-left text-sm font-medium w-[140px]">
                              Date
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium w-[120px]">
                              Amount
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium min-w-[200px]">
                              University/College
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium min-w-[200px]">
                              Course
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.paymentPlan.expectedPayments.map(
                            (payment, index) => (
                              <tr
                                key={index}
                                className={cn(
                                  "border-b last:border-0",
                                  index % 2 === 0
                                    ? "bg-background"
                                    : "bg-muted/30"
                                )}
                              >
                                <td className="px-4 py-3 text-sm whitespace-nowrap">
                                  {payment.date
                                    ? format(
                                        new Date(payment.date),
                                        "dd MMM yyyy"
                                      )
                                    : "Not specified"}
                                </td>
                                <td className="px-4 py-3 text-sm whitespace-nowrap">
                                  {payment.amount
                                    ? formatCurrency(payment.amount)
                                    : "Not specified"}
                                </td>
                                <td className="px-4 py-3 text-sm break-words">
                                  {payment.university ||
                                    data?.courseTitle ||
                                    "Not specified"}
                                </td>
                                <td className="px-4 py-3 text-sm break-words">
                                  {payment.course || "Not specified"}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile view */}
                  <div className="md:hidden space-y-4">
                    {data.paymentPlan.expectedPayments.map((payment, index) => (
                      <div
                        key={index}
                        className={cn(
                          "border rounded-lg p-4 space-y-3 max-w-full",
                          index % 2 === 0 ? "bg-background" : "bg-muted/30"
                        )}
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div className="min-w-0">
                            <p className="text-sm text-muted-foreground">
                              Date
                            </p>
                            <p className="text-sm font-medium mt-1 break-words">
                              {payment.date
                                ? format(new Date(payment.date), "dd MMM yyyy")
                                : "Not specified"}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-muted-foreground">
                              Amount
                            </p>
                            <p className="text-sm font-medium mt-1 break-words">
                              {payment.amount
                                ? formatCurrency(payment.amount)
                                : "Not specified"}
                            </p>
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-muted-foreground">
                            University/College
                          </p>
                          <p className="text-sm font-medium mt-1 break-words">
                            {payment.university ||
                              data?.courseTitle ||
                              "Not specified"}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-muted-foreground">
                            Course
                          </p>
                          <p className="text-sm font-medium mt-1 break-words">
                            {payment.course || "Not specified"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data?.tuition_doc_url && (
                <div className="space-y-4 mt-5">
                  <h4 className="font-medium mb-4">Tuition Document</h4>
                  <div className="border rounded-lg p-4 space-y-4 max-w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center">
                        <FileIcon className="size-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {data.tuition_doc_name || "Document"}
                        </p>
                      </div>
                      <div className="w-full sm:w-auto">
                        <a
                          href={data.tuition_doc_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex w-full sm:w-auto items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4"
                        >
                          <span className="mr-2">View Document</span>
                          <ExternalLinkIcon className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        Uploaded {format(new Date(), "dd MMM yyyy")}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-6">
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
                            if (value === "Other") {
                              setIsClicked(true);
                              field.onChange("Other");
                            } else {
                              setIsClicked(false);
                              setOtherOptionText("");
                              field.onChange(value);
                            }
                            setSlcSelected(
                              value === "Student Loan Company England (SLC)"
                            );

                            if (
                              value !== "Student Loan Company England (SLC)"
                            ) {
                              setPaymentStatus({});
                              form.reset({
                                ...form.getValues(),
                                tuitionFees: value,
                                paymentOption: value,
                                appliedForCourse: undefined,
                                slcStatus: undefined,
                                crn: "",
                                courseFee: undefined,
                                previousFundingYear: undefined,
                                previouslyReceivedFunds: undefined,
                                tuitionFeeAmount: undefined,
                                maintenanceLoanAmount: undefined,
                                hasSlcAccount: undefined,
                                ssn: "",
                                expectedPayments: [],
                              });
                            }
                          }}
                          value={field.value}
                          className="flex flex-col space-y-1"
                          disabled={isSubmitting}
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
                            <FormLabel className="font-medium">Self</FormLabel>
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
                              />
                            </FormControl>
                            <FormLabel
                              className="font-medium"
                              onClick={() => {
                                setIsClicked(true);
                                field.onChange("Other");
                              }}
                            >
                              Other
                            </FormLabel>
                          </FormItem>
                          {isClicked && (
                            <FormControl>
                              <Input
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setOtherOptionText(value);
                                  // Only update form value if there's actual text
                                  field.onChange(
                                    value.trim() ? value : "Other"
                                  );
                                }}
                                value={otherOptionText}
                                type="text"
                                className={cn(
                                  "lg:max-w-[400px] mt-2",
                                  form.formState.errors.tuitionFees &&
                                    "border-destructive"
                                )}
                                placeholder="Please specify"
                              />
                            </FormControl>
                          )}
                        </RadioGroup>
                      </FormControl>
                      {form.formState.errors.tuitionFees && (
                        <p className="text-sm font-medium text-destructive mt-2">
                          {form.formState.errors.tuitionFees.message}
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                {slcSelected && (
                  <div className="space-y-6 border-t border-stroke pt-6">
                    <FormField
                      control={form.control}
                      name="hasSlcAccount"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>
                            Do you have an account with the Student Loan Company
                            (SLC)?
                          </FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={(value) => {
                                field.onChange(value);
                                if (value === "No") {
                                  // Get current form values
                                  const currentValues = form.getValues();

                                  // Reset all SLC-related fields while keeping other fields
                                  form.reset({
                                    ...currentValues,
                                    hasSlcAccount: "No", // Keep the "No" selection
                                    previouslyReceivedFunds: undefined,
                                    previousFundingYear: undefined,
                                    appliedForCourse: undefined,
                                    crn: undefined,
                                    slcStatus: undefined,
                                    tuitionFeeAmount: undefined,
                                    maintenanceLoanAmount: undefined,
                                    ssn: "",
                                    expectedPayments: [],
                                  });

                                  // Clear any validation errors for these fields
                                  form.clearErrors([
                                    "previouslyReceivedFunds",
                                    "previousFundingYear",
                                    "appliedForCourse",
                                    "crn",
                                    "slcStatus",
                                    "tuitionFeeAmount",
                                    "maintenanceLoanAmount",
                                    "ssn",
                                  ]);
                                }
                              }}
                              value={field.value}
                              className="flex flex-col space-y-1 sm:flex-row sm:space-x-4 sm:space-y-0"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="Yes" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Yes
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="No" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  No
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("hasSlcAccount") === "Yes" && (
                      <div className="space-y-6">
                        <FormField
                          control={form.control}
                          name="previouslyReceivedFunds"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Have you previously received funds from Student
                                Finance England?
                              </FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    if (value === "No") {
                                      form.setValue("previousFundingYear", "");
                                    }
                                  }}
                                  disabled={isSubmitting}
                                  value={field.value}
                                  className="flex flex-col space-y-1 sm:flex-row sm:space-x-4 sm:space-y-0"
                                >
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="Yes" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      Yes
                                    </FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="No" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      No
                                    </FormLabel>
                                  </FormItem>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {form.watch("previouslyReceivedFunds") === "Yes" && (
                          <div className="space-y-6">
                            <FormField
                              control={form.control}
                              name="previousFundingYear"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Previous funding year</FormLabel>
                                  <FormControl>
                                    <Select
                                      onValueChange={field.onChange}
                                      value={field.value}
                                      disabled={isSubmitting}
                                    >
                                      <FormControl>
                                        <SelectTrigger className="md:max-w-[350px]">
                                          <SelectValue placeholder="Select academic year" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {/* Add last 5 academic years */}
                                        {Array.from(
                                          {
                                            length: 20,
                                          },
                                          (_, i) => {
                                            const year =
                                              new Date().getFullYear() - i;
                                            return (
                                              <SelectItem
                                                key={year}
                                                value={`${year - 1}/${year}`}
                                              >
                                                {year - 1}/{year}
                                              </SelectItem>
                                            );
                                          }
                                        )}
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}

                        <FormField
                          control={form.control}
                          name="appliedForCourse"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel>
                                Have you applied for SLC funding for this
                                course?
                              </FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    if (value === "No") {
                                      form.reset({
                                        ...form.getValues(),
                                        crn: "",
                                        slcStatus: undefined,
                                        tuitionFeeAmount: undefined,
                                        maintenanceLoanAmount: undefined,
                                        ssn: "",
                                        expectedPayments: [],
                                      });
                                    }
                                  }}
                                  disabled={isSubmitting}
                                  value={field.value}
                                  className="flex flex-col space-y-1 sm:flex-row sm:space-x-4 sm:space-y-0"
                                >
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="Yes" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      Yes
                                    </FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="No" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      No
                                    </FormLabel>
                                  </FormItem>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {form.watch("appliedForCourse") === "Yes" && (
                      <div className="space-y-6">
                        <FormField
                          control={form.control}
                          name="crn"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Customer Reference Number (CRN)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Enter your CRN"
                                  value={field.value?.trim() || ""}
                                  disabled={isSubmitting}
                                  className="md:max-w-[350px]"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="slcStatus"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Application Status</FormLabel>
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  // Reset only SLC-related fields when changing status
                                  const currentValues = form.getValues();
                                  form.reset({
                                    ...currentValues,
                                    tuitionFeeAmount: undefined,
                                    maintenanceLoanAmount: undefined,
                                    ssn: "",
                                    expectedPayments: [],
                                    usingMaintenanceForTuition: false,
                                  });
                                  setPaymentStatus({});
                                }}
                                defaultValue={field.value}
                                disabled={isSubmitting}
                              >
                                <FormControl>
                                  <SelectTrigger className="md:min-w-[350px] md:max-w-[400px]">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="In-process">
                                    In-process
                                  </SelectItem>
                                  <SelectItem value="Approved - Tuition Fees">
                                    Approved - Tuition Fees
                                  </SelectItem>
                                  <SelectItem value="Approved - Tuition Fees & Maintenance Loan">
                                    Approved - Tuition Fees & Maintenance Loan
                                  </SelectItem>
                                  <SelectItem value="Approved - Maintenance Loan">
                                    Approved - Maintenance Loan
                                  </SelectItem>
                                  <SelectItem value="Rejected">
                                    Rejected
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {form.watch("slcStatus")?.startsWith("Approved") && (
                          <div className="space-y-6">
                            {(form.watch("slcStatus") ===
                              "Approved - Tuition Fees & Maintenance Loan" ||
                              form.watch("slcStatus") ===
                                "Approved - Tuition Fees") && (
                              <FormField
                                control={form.control}
                                name="tuitionFeeAmount"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Tuition Fee Amount</FormLabel>
                                    <FormControl>
                                      <AmountInput
                                        value={field.value}
                                        onChange={(value) => {
                                          field.onChange(
                                            value === "" ? "" : value
                                          );
                                        }}
                                        className="md:max-w-[350px]"
                                        disabled={isSubmitting}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}

                            {(form.watch("slcStatus") ===
                              "Approved - Tuition Fees & Maintenance Loan" ||
                              form.watch("slcStatus") ===
                                "Approved - Maintenance Loan") && (
                              <div className="space-y-6">
                                <FormField
                                  control={form.control}
                                  name="maintenanceLoanAmount"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>
                                        Maintenance Loan Amount
                                      </FormLabel>
                                      <FormControl>
                                        <AmountInput
                                          value={field.value}
                                          onChange={(value) =>
                                            field.onChange(value)
                                          }
                                          className="md:max-w-[350px]"
                                          disabled={isSubmitting}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            )}

                            <FormField
                              control={form.control}
                              name="ssn"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    Student Support Number (SSN)
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="text"
                                      placeholder="Enter your SSN"
                                      className={cn(
                                        "md:max-w-[350px]",
                                        form.formState.errors.ssn &&
                                          "border-red-500"
                                      )}
                                      disabled={isSubmitting}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="space-y-4 border-t border-stroke pt-6">
                              <div className="flex flex-col">
                                <div className="flex flex-col space-y-2 mb-4">
                                  <FormLabel>Expected Payments</FormLabel>
                                  {paymentStatus.insufficientTuition && (
                                    <p className="text-sm text-muted-foreground">
                                      You need to make additional payments to
                                      cover the tuition fee shortfall of £
                                      {paymentStatus.difference.toFixed(2)}
                                    </p>
                                  )}
                                  {fields.map((field, index) => (
                                    <div
                                      key={field.id}
                                      className="pt-4 space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4"
                                    >
                                      <FormField
                                        control={form.control}
                                        name={`expectedPayments.${index}.date`}
                                        render={({ field }) => (
                                          <FormItem className="flex flex-col space-y-2">
                                            <FormLabel className="md:block hidden">
                                              Date
                                            </FormLabel>
                                            <Popover>
                                              <PopoverTrigger asChild>
                                                <FormControl>
                                                  <div className="flex h-full items-end">
                                                    <Button
                                                      type="button"
                                                      variant={"outline"}
                                                      disabled={isSubmitting}
                                                      className={cn(
                                                        "w-full pl-3 h-12 rounded-lg text-left font-normal",
                                                        !field.value &&
                                                          "text-muted-foreground"
                                                      )}
                                                    >
                                                      {field.value ? (
                                                        format(
                                                          field.value,
                                                          "PPP"
                                                        )
                                                      ) : (
                                                        <span>Pick a date</span>
                                                      )}
                                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                  </div>
                                                </FormControl>
                                              </PopoverTrigger>
                                              <PopoverContent
                                                className="w-auto p-0"
                                                align="start"
                                              >
                                                <Calendar
                                                  mode="single"
                                                  selected={field.value}
                                                  onSelect={field.onChange}
                                                  disabled={(date) =>
                                                    date >
                                                    new Date("2100-01-01")
                                                  }
                                                  initialFocus
                                                  weekStartsOn={1}
                                                />
                                              </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />

                                      <FormField
                                        control={form.control}
                                        name={`expectedPayments.${index}.amount`}
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="sr-only md:not-sr-only">
                                              Amount
                                            </FormLabel>
                                            <FormControl>
                                              <AmountInput
                                                value={field.value}
                                                onChange={(value) =>
                                                  field.onChange(value)
                                                }
                                                disabled={isSubmitting}
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />

                                      <FormField
                                        control={form.control}
                                        name={`expectedPayments.${index}.university`}
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="sr-only md:not-sr-only">
                                              University or College
                                            </FormLabel>
                                            <Select
                                              onValueChange={field.onChange}
                                              value={field.value}
                                              disabled={isSubmitting}
                                            >
                                              <FormControl>
                                                <SelectTrigger>
                                                  <SelectValue placeholder="Select university or college" />
                                                </SelectTrigger>
                                              </FormControl>
                                              <SelectContent>
                                                <SelectItem value="Plymouth Marjon University">
                                                  Plymouth Marjon University
                                                </SelectItem>
                                                <SelectItem value="Gloucestershire College">
                                                  Gloucestershire College
                                                </SelectItem>
                                              </SelectContent>
                                            </Select>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />

                                      <FormField
                                        control={form.control}
                                        name={`expectedPayments.${index}.course`}
                                        render={({ field }) => (
                                          <FormItem className="lg:w-max">
                                            <FormLabel className="sr-only md:not-sr-only">
                                              Course
                                            </FormLabel>
                                            <Select
                                              onValueChange={field.onChange}
                                              value={data.courseTitle}
                                              defaultValue={data.courseTitle}
                                              disabled
                                            >
                                              <FormControl>
                                                <SelectTrigger>
                                                  <SelectValue placeholder="Select course" />
                                                </SelectTrigger>
                                              </FormControl>
                                              <SelectContent>
                                                {courses.map((course) => (
                                                  <SelectItem
                                                    className="w-full"
                                                    key={course.id}
                                                    value={course.name}
                                                  >
                                                    {course.name}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />

                                      <Button
                                        type="button"
                                        variant="destructive"
                                        disabled={isSubmitting}
                                        size="sm"
                                        onClick={() => remove(index)}
                                        className="w-full md:col-span-2 lg:col-span-3"
                                      >
                                        <Trash className="h-4 w-4 mr-2" />
                                        Remove Payment
                                      </Button>
                                    </div>
                                  ))}

                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="mt-10 w-full md:w-fit"
                                    onClick={() => {
                                      const currentCourse = courseTitle;
                                      if (!currentCourse) {
                                        toast({
                                          title: "Error",
                                          description:
                                            "Please select a course first",
                                          variant: "destructive",
                                        });
                                        return;
                                      }
                                      append({
                                        date: undefined,
                                        amount: undefined,
                                        university:
                                          "Plymouth Marjon University",
                                        course: currentCourse,
                                      });
                                    }}
                                    disabled={
                                      isSubmitting || fields.length >= 3
                                    }
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Payment
                                  </Button>

                                  {/* {fields.length >= 3 && (
                                    <p className="text-sm text-muted-foreground mt-2">
                                      Maximum of 3 payments allowed
                                    </p>
                                  )} */}

                                  {form.formState.errors.expectedPayments && (
                                    <p className="mt-2 text-[0.8rem] font-medium text-destructive">
                                      {
                                        form.formState.errors.expectedPayments
                                          .message
                                      }
                                    </p>
                                  )}

                                  {form.formState.errors.expectedPayments?.root
                                    ?.message && (
                                    <p className="mt-2 text-[0.8rem] font-medium text-destructive">
                                      {
                                        form.formState.errors.expectedPayments
                                          .root.message
                                      }
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {watchSlcStatus?.startsWith("Approved") && (
                          <div className="space-y-4 border-t border-stroke pt-6">
                            <div className="space-y-2">
                              <FormLabel>Upload Tuition Documents</FormLabel>
                              <MultiUploader
                                onChange={(file, isRemoved) => {
                                  if (isRemoved) {
                                    setTuitionFile(null);
                                  } else {
                                    setTuitionFile(file);
                                  }
                                }}
                                isPending={isSubmitting}
                                fileType="file"
                                defaultFile={tuitionFile}
                                defaultPreviewUrl={
                                  data?.tuition_doc_url || null
                                }
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-6 border-t border-stroke">
                <div className="flex justify-end gap-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending || isSubmitting}>
                    {isSubmitting && (
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save changes
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
};

export default FinanceForm;
