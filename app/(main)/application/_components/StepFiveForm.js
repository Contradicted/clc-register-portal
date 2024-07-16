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
    const defaultIsClicked = application
        ? ![
              '',
              undefined,
              null,
              'Newspaper/Magazine',
              'Relative/Friend',
              'Google',
              'Facebook',
              'Recruitment Agent',
          ].includes(fData?.marketing || application?.marketing)
        : false
    const [isClicked, setIsClicked] = useState(defaultIsClicked)
    const [otherOptionText, setOtherOptionText] = useState(
        defaultIsClicked ? fData?.otherOptionText || '' : ''
    )

    const [isPending, startTransition] = useTransition()
    const [isSubmitPending, startSubmitTransition] = useTransition()
    const [formErrors, setFormErrors] = useState()
    const [error, setError] = useState()

    const { toast } = useToast()
    const router = useRouter()
    const { data: session, update } = useSession()

    const form = useForm({
        defaultValues: {
            marketing: fData?.marketing || application?.marketing || '',
        },
    })

    useEffect(() => {
        if (defaultIsClicked) {
            form.setValue('marketing', 'Other')
            setOtherOptionText(fData?.otherOptionText || '')
        }
    }, [application, fData, form, defaultIsClicked])

    const onSubmit = async () => {
        if (isClicked && !otherOptionText) {
            setFormErrors('Please specify where you heard about us.')
            return
        }

        setError('')
        setFormErrors('')
        const stepFiveData = form.getValues()

        const currentValues = {
            ...fData,
            ...stepFiveData,
            marketing: isClicked ? otherOptionText : stepFiveData.marketing,
            // otherOptionText: isClicked ? otherOptionText : "",
        }

        const formData = new FormData()
        for (const key in accumulatedFiles) {
            if (accumulatedFiles[key]) {
                formData.append(key, accumulatedFiles[key].file)
                formData.append(
                    `${key}_alreadyExists`,
                    accumulatedFiles[key].alreadyExists
                )
            }
        }

        startSubmitTransition(() => {
            submit(
                JSON.stringify(currentValues),
                deletedQualifications,
                deletedWorkExperiences,
                formData
            ).then(async (data) => {
                if (data?.success) {
                    toast({
                        variant: 'success',
                        title: data.success,
                    })
                }

                await update({
                    ...session,
                    user: {
                        ...session.user,
                        hasApplication: true,
                    },
                })

                router.replace('/dashboard')

                if (data?.error) {
                    setError(data.error)
                }
            })
        })
    }

    const onPrevious = () => {
        setFormErrors('')
        const currentValues = form.getValues()

        if (isClicked && !otherOptionText) {
            setFormErrors('Please specify where you heard about us.')
            return
        }

        const updatedValues = {
            ...currentValues,
            marketing: isClicked ? 'Other' : currentValues.marketing,
            otherOptionText: isClicked ? otherOptionText : '',
        }

        updateData(updatedValues, accumulatedFiles)
        previousStep(updatedValues, accumulatedFiles)
    }

    const saveForm = () => {
        if (isClicked && !otherOptionText) {
            setFormErrors('Please specify where you heard about us.')
            return
        }

        setError('')
        setFormErrors('')
        const stepFiveData = form.getValues()

        const currentValues = {
            ...fData,
            ...stepFiveData,
            marketing: isClicked ? otherOptionText : stepFiveData.marketing,
            // otherOptionText: isClicked ? otherOptionText : "",
        }

        const formData = new FormData()
        for (const key in accumulatedFiles) {
            if (accumulatedFiles[key]) {
                formData.append(key, accumulatedFiles[key].file)
                formData.append(
                    `${key}_alreadyExists`,
                    accumulatedFiles[key].alreadyExists
                )
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
                        variant: 'success',
                        title: data.success,
                    })

                    router.push('/application-saved')
                }

                if (data?.error) {
                    setError(data.error)
                }
            })
        })
    }

    return (
        <div className="w-full px-5 lg:px-[50px]">
            <FormError message={formErrors || error} />
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="mt-5">
                    <div className="flex flex-col text-left">
                        <h1 className="font-semibold text-[20px]">
                            Marketing Information
                        </h1>
                        <span className="text-[14px] text-[#929EAE]">
                            It would be helpful if you could kindly tell us
                            where you heard about the City of London College by
                            ticking the appropriate box
                        </span>
                    </div>

                    <div className="w-full h-full lg:flex lg:flex-col lg:px-10 mt-5">
                        <div>
                            <div className="flex flex-col mb-10 lg:items-center gap-10 lg:flex-row">
                                <div className="flex flex-col gap-2 w-full">
                                    <FormField
                                        control={form.control}
                                        name="marketing"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <RadioGroup
                                                        onValueChange={(
                                                            value
                                                        ) => {
                                                            field.onChange(
                                                                value
                                                            )
                                                            if (
                                                                value ===
                                                                'Other'
                                                            ) {
                                                                setIsClicked(
                                                                    true
                                                                )
                                                            } else {
                                                                setIsClicked(
                                                                    false
                                                                )
                                                                setOtherOptionText(
                                                                    ''
                                                                )
                                                            }
                                                        }}
                                                        value={
                                                            isClicked
                                                                ? 'Other'
                                                                : field.value
                                                        }
                                                        className="flex flex-col space-y-1"
                                                        disabled={
                                                            isPending ||
                                                            isSubmitPending
                                                        }
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
                                                                Recruitment
                                                                Agent
                                                            </FormLabel>
                                                        </FormItem>
                                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                                            <FormControl>
                                                                <RadioGroupItem
                                                                    value="Other"
                                                                    checked={
                                                                        isClicked
                                                                    }
                                                                    onClick={() =>
                                                                        setIsClicked(
                                                                            true
                                                                        )
                                                                    }
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="font-medium">
                                                                Other
                                                            </FormLabel>
                                                        </FormItem>
                                                        {isClicked && (
                                                            <FormControl>
                                                                <Input
                                                                    value={
                                                                        otherOptionText
                                                                    }
                                                                    type="text"
                                                                    className="lg:max-w-[400px]"
                                                                    onChange={(
                                                                        e
                                                                    ) => {
                                                                        setOtherOptionText(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }}
                                                                />
                                                            </FormControl>
                                                        )}
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
                        isSubmitPending={isSubmitPending}
                        onSave={saveForm}
                        onSubmit={onSubmit}
                        previousStep={onPrevious}
                        isLastStep={isLastStep}
                    />
                </form>
            </Form>
        </div>
    )
}
