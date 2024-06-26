import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";

export const FormButtons = ({
  isFirstStep,
  isLastStep,
  nextStep,
  previousStep,
  onClick,
  onSave,
  isPending
}) => {
  return (
    <div className="w-full flex items-center gap-4 justify-center mt-9 mb-[50px]">
      <Button onClick={onSave} disabled={isPending}>
        {isPending ? (
          <LoaderCircle className="animate-spin" />
        ) : (
          <p>Save and Exit</p>
        )}
      </Button>
      {!isFirstStep && <Button onClick={previousStep}>Previous</Button>}
      {!isLastStep && <Button onClick={nextStep}>Next</Button>}
      {isLastStep && <Button>Submit</Button>}
    </div>
  );
};
