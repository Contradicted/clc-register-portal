import { Steps } from "react-step-builder";
import { StepOneForm } from "./StepOneForm";
import { StepTwoForm } from "./StepTwoForm";

export const Stages = ({
    userData,
    formData,
    next
}) => {
    return (
      <Steps>
        <StepOneForm
          userDetails={userData}
          application={formData}
        />
        ,
        <StepTwoForm application={formData} />
      </Steps>
    );
}