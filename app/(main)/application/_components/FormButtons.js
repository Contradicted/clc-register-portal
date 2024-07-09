import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";

export const FormButtons = ({
  isFirstStep,
  isLastStep,
  nextStep,
  isSubmitPending,
  previousStep,
  onSubmit,
  onSave,
  isPending,
}) => {
  return (
    <div className="w-full flex items-center gap-4 justify-center mt-9 mb-[50px]">
      <Button onClick={onSave} disabled={isPending || isSubmitPending}>
        {isPending ? (
          <LoaderCircle className="animate-spin" />
        ) : (
          <p>Save and Exit</p>
        )}
      </Button>
      {!isFirstStep && (
        <Button onClick={previousStep} disabled={isPending || isSubmitPending}>
          Previous
        </Button>
      )}
      {!isLastStep && (
        <Button onClick={nextStep} disabled={isPending || isSubmitPending}>
          Next
        </Button>
      )}
      {isLastStep && (
        <Button onClick={onSubmit} disabled={isPending || isSubmitPending}>
          {isSubmitPending ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <p>Submit</p>
          )}
        </Button>
      )}
    </div>
  );
};
