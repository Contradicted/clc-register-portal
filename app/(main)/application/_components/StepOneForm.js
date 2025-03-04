'use client'

import { compareAsc, format } from 'date-fns'
import {
    CalendarIcon,
    InfoIcon,
    Loader2,
    LoaderCircle,
    Plus,
    Trash,
} from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { cn, formatCurrency, formatStudyMode } from '@/lib/utils'
import { PhoneInput } from '@/components/ui/phone-input'
import { FormButtons } from './FormButtons'
import { FormError } from '@/components/FormError'
import { save } from '@/actions/save'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { MultiUploader } from '@/components/CustomUploader'
import { useMultiStepForm } from '@/hooks/useMultiStepForm'
import { SectionOneSchema } from '@/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import PlaceOfBirthInput from './PlaceOfBirthInput'

import countries from 'i18n-iso-countries'
import nationalities from 'i18n-nationality'
import countriesEnglish from 'i18n-iso-countries/langs/en.json'
import nationalitiesEnglish from 'i18n-nationality/langs/en.json'
import { popularCountries, popularNationalities } from '@/constants'
import { getActiveCourses } from '@/data/courses'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import AmountInput from '@/components/amount-input'

countries.registerLocale(countriesEnglish)
nationalities.registerLocale(nationalitiesEnglish)

const PhotoGuidelines = ({ setIsModalOpen }) => (
    <div className="space-y-2 text-sm text-muted-foreground">
        <p>Your photo should:</p>
        <ul className="list-disc list-inside">
            <li>Show your full face, front view</li>
            <li>Have a plain, light background</li>
            <li>Be clear and in focus</li>
        </ul>
        <Button
            type="button"
            variant="link"
            onClick={() => setIsModalOpen(true)}
            className="px-0"
        >
            View full guidelines
        </Button>
    </div>
)

export const StepOneForm = ({
    activeCourses,
    application,
    userDetails,
    isFirstStep,
    nextStep,
    fData,
    updateData,
    savedQualifications,
    accumulatedFiles,
    deletedQualifications,
    deletedPendingQualifications,
    deletedWorkExperiences,
    setAccumulatedFiles,
}) => {
    const defaultIsClicked = application
        ? ![
              '',
              null,
              undefined,
              'Parents',
              'Family Members',
              'Employers',
              'Self',
              'Student Loan Company England (SLC)',
          ].includes(application.tuitionFees)
        : false

    const [file, setFile] = useState(null)
    const [idFile, setIdFile] = useState(null)
    const [immigrationFile, setImmigrationFile] = useState(null)
    const [tuitionFile, setTuitionFile] = useState(null)
    const [isClicked, setIsClicked] = useState(defaultIsClicked)
    const [isPending, startTransition] = useTransition()
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [error, setError] = useState()
    const [hasError, setHasError] = useState(false)
    const [isRemoved, setIsRemoved] = useState(false)
    const [otherOptionText, setOtherOptionText] = useState(
        defaultIsClicked ? application?.tuitionFees : ''
    )
    const [isEntryDateRequired, setIsEntryDateRequired] = useState(
        (application?.countryOfBirth !== 'United Kingdom' &&
            (application?.nationality !== 'British' || application?.nationality !== "Irish")) ||
            false
    )
    const [isImmigrationRequired, setIsImmigrationRequired] = useState(false)
    const [isShareCodeRequired, setIsShareCodeRequired] = useState(false)
    const [detectedCountry, setDetectedCountry] = useState(
        fData?.countryOfBirth || application?.countryOfBirth || ''
    )
    const [courses, setCourses] = useState([])
    const [studyModes, setStudyModes] = useState([])
    const [courseInstances, setCourseInstances] = useState([])
    const [slcSelected, setSlcSelected] = useState(
        fData?.tuitionFees === 'Student Loan Company England (SLC)' ||
            application?.tuitionFees === 'Student Loan Company England (SLC)'
    )
    const [totalAmount, setTotalAmount] = useState(0)
    // const [paymentAmounts, setPaymentAmounts] = useState({});
    const [selectedCourseFee, setSelectedCourseFee] = useState(null)
    const [feeDifference, setFeeDifference] = useState(null)
    const [maintenanceDifference, setMaintenanceDifference] = useState(null)

    // New states for enhanced functionality
    const [paymentStatus, setPaymentStatus] = useState({
        difference: application?.paymentPlan?.difference || 0,
        insufficientTuition: false,
        insufficientMaintenance: false,
    })

    const [useMaintenanceForTuition, setUseMaintenanceForTuition] = useState(
        application?.paymentPlan?.usingMaintenanceForTuition
    )

    const [showMaintenanceOption, setShowMaintenanceOption] = useState(
        application?.paymentPlan?.slcStatus ===
            'Approved - Tuition Fees & Maintenance Loan'
    )
    const [isCreatingPaymentPlan, setIsCreatingPaymentPlan] = useState(false)

    // console.log(application)

    const form = useForm({
        defaultValues: {
            courseTitle: application?.courseTitle || undefined,
            studyMode: application?.studyMode || undefined,
            commencement: application?.commencement || undefined,
            campus: application?.campus || undefined,
            title: userDetails?.title || application?.title || undefined,
            firstName:
                userDetails?.firstName || application?.firstName || undefined,
            lastName:
                userDetails?.lastName || application?.lastName || undefined,
            gender: userDetails?.gender || application?.gender || undefined,
            dateOfBirth:
                userDetails?.dateOfBirth ||
                application?.dateOfBirth ||
                undefined,
            placeOfBirth: application?.placeOfBirth || undefined,
            countryOfBirth: application?.countryOfBirth || undefined,
            nationality: application?.nationality || undefined,
            immigration_status: application?.immigration_status || undefined,
            share_code: application?.share_code || undefined,
            entryDateToUK: application?.entryDateToUK || undefined,
            identificationNo: application?.identificationNo || undefined,
            addressLine1:
                fData?.addressLine1 ||
                userDetails?.addressLine1 ||
                application?.addressLine1 ||
                undefined,
            addressLine2:
                fData?.addressLine2 ||
                userDetails?.addressLine2 ||
                application?.addressLine2 ||
                undefined,
            city: userDetails?.city || application?.city || undefined,
            postcode:
                userDetails?.postcode || application?.postcode || undefined,
            homeTelephoneNo:
                userDetails?.homeTelephoneNo ||
                application?.homeTelephoneNo ||
                undefined,
            mobileNo:
                userDetails?.mobileNo || application?.mobileNo || undefined,
            email: userDetails?.email || application?.email || undefined,
            emergency_contact_name:
                application?.emergency_contact_name || undefined,
            emergency_contact_no:
                application?.emergency_contact_no || undefined,
            tuitionFees: application?.tuitionFees || undefined,
            paymentOption: application?.paymentPlan?.paymentOption || undefined,
            hasSlcAccount:
                fData?.hasSlcAccount ||
                (application?.paymentPlan?.hasSlcAccount === true
                    ? 'Yes'
                    : application?.paymentPlan?.hasSlcAccount === false
                    ? 'No'
                    : undefined),
            previouslyReceivedFunds:
                fData?.previouslyReceivedFunds ||
                (application?.paymentPlan?.previouslyReceivedFunds === true
                    ? 'Yes'
                    : application?.paymentPlan?.previouslyReceivedFunds ===
                      false
                    ? 'No'
                    : undefined),
            previousFundingYear:
                fData?.previousFundingYear ||
                application?.paymentPlan?.previousFundingYear ||
                undefined,
            appliedForCourse:
                fData?.appliedForCourse ||
                (application?.paymentPlan?.appliedForCourse && 'Yes') ||
                undefined,
            crn: fData?.crn || application?.paymentPlan?.crn?.trim() || '',
            slcStatus:
                fData?.slcStatus ||
                application?.paymentPlan?.slcStatus ||
                undefined,
            tuitionFeeAmount:
                fData?.tuitionFeeAmount ||
                application?.paymentPlan?.tuitionFeeAmount ||
                undefined,
            courseFee: fData?.paymentPlan?.courseFee || undefined,
            maintenanceLoanAmount:
                fData?.maintenanceLoanAmount ||
                application?.paymentPlan?.maintenanceLoanAmount ||
                undefined,
            ssn: fData?.ssn || application?.paymentPlan?.ssn || '',
            usingMaintenanceForTuition:
                fData?.usingMaintenanceForTuition ||
                application?.paymentPlan?.usingMaintenanceForTuition ||
                false,
            expectedPayments: [],
        },
        resolver: zodResolver(SectionOneSchema),
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'expectedPayments',
    })

    const now = new Date()
    const { toast } = useToast()
    const router = useRouter()

    const watchCountryOfBirth = form.watch('countryOfBirth')
    const watchNationality = form.watch('nationality')
    const watchImmigrationStatus = form.watch('immigration_status')
    const watchCourseTitle = form.watch('courseTitle')
    const watchExpectedPayments = form.watch('expectedPayments')
    const watchStudyMode = form.watch('studyMode')
    const watchSlcStatus = form.watch('slcStatus')
    const watchTuitionFeeAmount = form.watch('tuitionFeeAmount')
    const watchMaintenanceLoanAmount = form.watch('maintenanceLoanAmount')
    const watchUsingMaintenanceForTuition = form.watch(
        'usingMaintenanceForTuition'
    )

    // Check if hybrid course is selected
    const isHybridCourse =
      watchCourseTitle ===
        "Master of Business Administration - MBA - (Top-Up) - Hybrid" ||
      watchStudyMode === "hybrid_learning";

    // Update hideEqualOpportunities only when course changes
    useEffect(() => {
        if (watchCourseTitle || watchStudyMode) {
          // Only run if we have a course title
          const shouldHide =
            watchCourseTitle ===
              "Master of Business Administration - MBA - (Top-Up) - Hybrid" ||
            watchStudyMode === "hybrid_learning";
          if (shouldHide !== application?.hideEqualOpportunities) {
            // Only update if value is different
            updateData({
              hideEqualOpportunities: shouldHide,
              campus: shouldHide ? null : application?.campus, // Clear campus if hybrid
            });
          }
        }
      }, [watchCourseTitle, watchStudyMode]); // Only depend on course title changes

    const handlePlaceSelect = ({ placeOfBirth, countryName }) => {
        form.setValue('placeOfBirth', placeOfBirth)
        setDetectedCountry(countryName)
    }

    const createPaymentPlan = (amount, numberOfPayments = 2) => {
        const paymentAmount = Number((amount / numberOfPayments).toFixed(2))
        const remainder = Number(
            (amount - paymentAmount * (numberOfPayments - 1)).toFixed(2)
        )

        return Array(numberOfPayments)
            .fill(null)
            .map((_, index) => ({
                date: undefined,
                amount:
                    index === numberOfPayments - 1 ? remainder : paymentAmount,
                university: 'Plymouth Marjon University',
                course: form.watch('courseTitle') || '',
            }))
    }

    const handleMaintenancePaymentPlan = () => {
        const maintenanceAmount = form.watch('maintenanceLoanAmount')
        const currentCourseFee = selectedCourseFee

        if (maintenanceAmount && currentCourseFee) {
            setIsCreatingPaymentPlan(true)

            // Clear existing payments
            while (fields.length > 0) {
                remove(0)
            }

            // Create new payment plan
            const payments = createPaymentPlan(currentCourseFee)
            payments.forEach((payment) => append(payment))

            toast.success('Payment plan created', {
                description: 'Please review and adjust the dates as needed.',
            })

            setIsCreatingPaymentPlan(false)
        }
    }

    const onSubmit = (values) => {
        console.log('test')
    }

    const onNext = () => {
        let shortfall = null

        setHasError(false)
        if (!file) {
            setIsRemoved(true)
        }
        const currentValues = form.getValues()

        // Clear campus if hybrid course
      if (isHybridCourse) {
        currentValues.campus = null;
      }

        const isValid = SectionOneSchema.safeParse(currentValues)

        if (!isValid.success) {
            console.log(isValid.error.formErrors.fieldErrors)
            setError(isValid.error.formErrors.fieldErrors)
            return
        }

        if (currentValues.countryOfBirth !== detectedCountry) {
            setError('Please select the right country')
            return
        }

        if (isClicked && !otherOptionText) {
            setError('Please specify how you will fund your studies.')
            setHasError(true)
            return
        }

        if (currentValues.countryOfBirth === 'United Kingdom') {
            currentValues.entryDateToUK = null
        }

        if (currentValues.nationality === 'British' || currentValues.nationality === "Irish") {
            currentValues.immigration_status = null
            currentValues.entryDateToUK = null
            currentValues.share_code = null
        }

        if (
            currentValues.slcStatus === 'Approved - Maintenance Loan' &&
            currentValues.maintenanceLoanAmount &&
            selectedCourseFee &&
            currentValues.maintenanceLoanAmount < selectedCourseFee
        ) {
            shortfall = {
                type: 'maintenance',
                amount: selectedCourseFee - currentValues.maintenanceLoanAmount,
                courseFee: selectedCourseFee,
                approvedAmount: currentValues.maintenanceLoanAmount,
                status: currentValues.slcStatus,
            }
        }

        // Check for tuition fee shortfall
        if (
            (currentValues.slcStatus === 'Approved - Tuition Fees' ||
                currentValues.slcStatus ===
                    'Approved - Tuition Fees & Maintenance Loan') &&
            currentValues.tuitionFeeAmount &&
            selectedCourseFee &&
            currentValues.tuitionFeeAmount < selectedCourseFee &&
            !useMaintenanceForTuition
        ) {
            shortfall = {
                type: 'tuition',
                amount: selectedCourseFee - currentValues.tuitionFeeAmount,
                courseFee: selectedCourseFee,
                approvedAmount: currentValues.tuitionFeeAmount,
                status: currentValues.slcStatus,
            }
        }

        const submissionData = {
            ...currentValues,
            shortfall,
            paymentStatus:
                currentValues.tuitionFees !==
                'Student Loan Company England (SLC)'
                    ? {}
                    : {
                          ...paymentStatus,
                          courseFee: selectedCourseFee,
                          totalAmount,
                      },
        }

        updateData(
            {
                ...submissionData,
                tuitionFees: isClicked
                    ? otherOptionText
                    : currentValues.tuitionFees,
            },
            accumulatedFiles
        )
        nextStep(
            {
                ...currentValues,
                tuitionFees: isClicked
                    ? otherOptionText
                    : currentValues.tuitionFees,
            },
            accumulatedFiles
        )
    }

    useEffect(() => {
        const savedPayments =
            fData?.expectedPayments ||
            application?.paymentPlan?.expectedPayments

        if (savedPayments?.length > 0 && fields.length === 0) {
            const formattedPayments = savedPayments.map((payment) => ({
                ...payment,
                date: payment.date ? new Date(payment.date) : undefined,
            }))

            form.setValue('expectedPayments', formattedPayments)
        }
    }, [
        application?.paymentPlan?.expectedPayments,
        fData?.expectedPayments,
        form,
        fields.length,
    ])

    useEffect(() => {
        if (application && application.photoUrl && !accumulatedFiles.file) {
            setIsLoading(true)
            try {
                fetch(application.photoUrl)
                    .then((response) => response.blob())
                    .then((blob) => {
                        const file = new File([blob], application.photoName, {
                            type: blob.type,
                        })
                        setFile(file)
                        setAccumulatedFiles((prev) => ({
                            ...prev,
                            file: { file, alreadyExists: true },
                        }))
                    })
                setIsLoading(false)
            } catch (error) {
                setIsLoading(false)
                console.error('Error loading file:', error)
            }
        }

        if (
            application &&
            application.identificationNoUrl &&
            !accumulatedFiles.idFile
        ) {
            setIsLoading(true)

            try {
                fetch(application.identificationNoUrl)
                    .then((response) => response.blob())
                    .then((blob) => {
                        const file = new File(
                            [blob],
                            application.identificationNo,
                            {
                                type: blob.type,
                            }
                        )
                        setIdFile(file)
                        setAccumulatedFiles((prev) => ({
                            ...prev,
                            idFile: { file, alreadyExists: true },
                        }))
                    })

                setIsLoading(false)
            } catch (error) {
                setIsLoading(false)
                console.error('Error loading file:', error)
            }
        }
    }, [application, accumulatedFiles, setAccumulatedFiles])

    useEffect(() => {
        if (
            application &&
            application.immigration_url &&
            !accumulatedFiles.immigrationFile
        ) {
            setIsLoading(true)

            try {
                fetch(application.immigration_url)
                    .then((response) => response.blob())
                    .then((blob) => {
                        const file = new File(
                            [blob],
                            application.immigration_name,
                            {
                                type: blob.type,
                            }
                        )
                        setImmigrationFile(file)
                        setAccumulatedFiles((prev) => ({
                            ...prev,
                            immigrationFile: { file, alreadyExists: true },
                        }))
                    })
                setIsLoading(false)
            } catch (error) {
                setIsLoading(false)
                console.error('Error loading file:', error)
            }
        }

        setIsLoading(false)
    }, [application, accumulatedFiles.immigrationFile, setAccumulatedFiles])

    useEffect(() => {
        if (
            application &&
            application.tuition_doc_url &&
            !accumulatedFiles.tuitionDoc
        ) {
            setIsLoading(true)

            try {
                fetch(application.tuition_doc_url)
                    .then((response) => response.blob())
                    .then((blob) => {
                        const file = new File(
                            [blob],
                            application.tuition_doc_name,
                            {
                                type: blob.type,
                            }
                        )
                        setTuitionFile(file)
                        setAccumulatedFiles((prev) => ({
                            ...prev,
                            tuitionDoc: { file, alreadyExists: true },
                        }))
                    })
                setIsLoading(false)
            } catch (error) {
                setIsLoading(false)
                console.error('Error loading file:', error)
            }
        }

        setIsLoading(false)
    }, [application, accumulatedFiles.tuitionDoc, setAccumulatedFiles])

    useEffect(() => {
        if (defaultIsClicked) {
            form.setValue('tuitionFees', 'Other')
            setOtherOptionText(otherOptionText || '')
        }
    }, [form, defaultIsClicked, otherOptionText])

    useEffect(() => {
        if (
            watchCountryOfBirth === 'United Kingdom' &&
            (watchNationality === 'British' || watchNationality === "Irish")
        ) {
            setIsEntryDateRequired(false)
        } else if (
            (watchCountryOfBirth !== 'United Kingdom' &&
                (watchNationality === 'British' || watchNationality === "Irish")) ||
            (watchCountryOfBirth !== 'United Kingdom' &&
                watchNationality !== 'British' && watchNationality !== "Irish")
        ) {
            setIsEntryDateRequired(true)
        } else {
            setIsEntryDateRequired(false)
        }
    }, [watchCountryOfBirth, watchNationality])

    useEffect(() => {
        setIsImmigrationRequired(
            watchNationality !== 'British' && watchNationality !== "Irish" && watchNationality !== undefined
        )

        if (watchNationality === 'British' || watchNationality === "Irish") {
            setAccumulatedFiles((prev) => ({
                ...prev,
                immigrationFile_isRemoved: true,
            }))
        }
    }, [watchNationality, setAccumulatedFiles])

    useEffect(() => {
        setIsShareCodeRequired(watchImmigrationStatus !== undefined)
    }, [watchImmigrationStatus])

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await fetch('/api/courses')
                if (!response.ok) {
                    throw new Error('Failed to fetch courses')
                }
                const data = await response.json()
                setCourses(data)

                // Find selected course and set study mode
                const selectedCourse = data.find(
                    (course) => course.name === application?.courseTitle
                )
                if (selectedCourse) {
                    setStudyModes(selectedCourse.course_study_mode)
                    setCourseInstances(selectedCourse.course_instances)
                }
            } catch (error) {
                console.error('Error fetching courses:', error)
            }
        }
        fetchCourses()
    }, [application?.courseTitle])

    useEffect(() => {
        const selectedCourse = courses.find(
            (course) => course.name === form.getValues('courseTitle')
        )

        if (selectedCourse) {
            setStudyModes(selectedCourse.course_study_mode)
            setCourseInstances(selectedCourse.course_instances)
            setSelectedCourseFee(null)

            const currentStudyMode = form.getValues('studyMode')
            const isValidStudyMode = selectedCourse.course_study_mode.some(
                (mode) => mode.study_mode === currentStudyMode
            )

            if (!isValidStudyMode) {
                form.setValue('studyMode', '')
            }

            const currentInstance = form.getValues('commencement')
            const isValidInstance = selectedCourse.course_instances.some(
                (instance) => instance.instance_name === currentInstance
            )

            if (!isValidInstance) {
                form.setValue('commencement', '')
            }
        } else {
            setStudyModes([])
            setCourseInstances([])
            setSelectedCourseFee(null)
        }
    }, [watchCourseTitle, courses, form])

    // 2. Effect for updating course fee based on study mode
    useEffect(() => {
        const selectedCourse = courses.find(
            (course) => course.name === form.getValues('courseTitle')
        )
        const currentStudyMode = form.getValues('studyMode')

        if (selectedCourse && currentStudyMode) {
            const studyModeData = selectedCourse.course_study_mode.find(
                (mode) => mode.study_mode === currentStudyMode
            )

            if (studyModeData) {
                setSelectedCourseFee(studyModeData.tuition_fees)
            }
        }
    }, [watchCourseTitle, watchStudyMode, courses, form])

    useEffect(() => {
        if (selectedCourseFee) {
            form.setValue('courseFee', selectedCourseFee)
            console.log('done', selectedCourseFee)
        }
    }, [selectedCourseFee, form])

    console.log('coursefee', form.getValues('courseFee'))

    // Main effect for handling all payment scenarios
    useEffect(() => {
        if (
            !selectedCourseFee ||
            !form.watch('slcStatus')?.includes('Tuition Fees')
        )
            return

        const status = form.watch('slcStatus')
        const tuitionFee = form.watch('tuitionFeeAmount')
        const maintenanceLoan = form.watch('maintenanceLoanAmount')

        const newStatus = {}

        switch (status) {
            case 'Approved - Maintenance Loan':
                // Only check if maintenanceLoan has actually been entered
                if (maintenanceLoan !== undefined && maintenanceLoan !== '') {
                    if (maintenanceLoan < selectedCourseFee) {
                        newStatus.insufficientMaintenance = true
                        newStatus.difference = Number(
                            (selectedCourseFee - maintenanceLoan).toFixed(2)
                        )
                        setMaintenanceDifference(null)
                    } else {
                        setMaintenanceDifference(
                            Number(
                                (maintenanceLoan - selectedCourseFee).toFixed(2)
                            )
                        )
                        if (fields.length === 0 || !fields[0].amount) {
                            handleMaintenancePaymentPlan()
                        }
                    }
                }
                break

            case 'Approved - Tuition Fees':
                // Only check if tuitionFee has actually been entered
                if (tuitionFee !== undefined && tuitionFee !== '') {
                    if (tuitionFee < selectedCourseFee) {
                        newStatus.insufficientTuition = true
                        newStatus.difference = Number(
                            (selectedCourseFee - tuitionFee).toFixed(2)
                        )
                        setFeeDifference(
                            Number((selectedCourseFee - tuitionFee).toFixed(2))
                        )
                    } else {
                        setFeeDifference(null)
                    }
                }
                break

            case 'Approved - Tuition Fees & Maintenance Loan':
                // Only check if tuitionFee has actually been entered
                if (tuitionFee !== undefined && tuitionFee !== '') {
                    const tuitionDifference = selectedCourseFee - tuitionFee
                    if (tuitionDifference > 0) {
                        setFeeDifference(Number(tuitionDifference.toFixed(2)))

                        // Only show maintenance option if:
                        // 1. Tuition fee is less than course fee
                        // 2. Maintenance loan amount has been entered
                        // 3. Maintenance loan is sufficient to cover the difference
                        // 4. User hasn't already chosen to use maintenance
                        if (
                            maintenanceLoan !== undefined &&
                            maintenanceLoan !== '' &&
                            tuitionFee !== undefined &&
                            tuitionFee !== '' &&
                            maintenanceLoan >= tuitionDifference &&
                            !useMaintenanceForTuition
                        ) {
                            console.log('yep, doing this')
                            setShowMaintenanceOption(true)
                            newStatus.difference = tuitionDifference
                        } else {
                            setShowMaintenanceOption(false)
                            newStatus.insufficientTuition = true
                            newStatus.difference = tuitionDifference
                        }
                    } else {
                        setFeeDifference(null)
                        setShowMaintenanceOption(false)
                    }
                } else {
                    setShowMaintenanceOption(false)
                }
                break
        }

        setPaymentStatus(newStatus)
    }, [
        selectedCourseFee,
        watchSlcStatus,
        watchTuitionFeeAmount,
        watchMaintenanceLoanAmount,
        useMaintenanceForTuition,
    ])

    useEffect(() => {
        const values = form.watch('expectedPayments')
        const newTotal =
            values?.reduce((sum, payment) => {
                const amount = payment?.amount ? parseFloat(payment.amount) : 0
                return sum + amount
            }, 0) || 0

        setTotalAmount(Number(newTotal.toFixed(2)))
    }, [watchExpectedPayments])

    useEffect(() => {
        if (
            !selectedCourseFee ||
            !form.watch('slcStatus')?.includes('Tuition Fees')
        )
            return

        const tuitionAmount = Number(form.watch('tuitionFeeAmount')) || 0
        const isUsingMaintenance = form.watch('usingMaintenanceForTuition')
        const maintenanceAmount =
            Number(form.watch('maintenanceLoanAmount')) || 0

        console.log('using', isUsingMaintenance)

        // Calculate the target amount based on the scenario
        let targetAmount = 0

        if (isUsingMaintenance) {
            console.log('are we doing this?')
            // When using maintenance, we need to validate against the remaining tuition fee
            const remainingTuition = selectedCourseFee - tuitionAmount
            targetAmount = Math.min(remainingTuition, maintenanceAmount)
        } else {
            // When not using maintenance, validate against the full tuition amount
            targetAmount = tuitionAmount
        }

        // Only set error if difference is significant (using 0.01 tolerance)
        if (Math.abs(totalAmount - targetAmount) > 0.01) {
            form.setError('expectedPayments', {
                type: 'custom',
                message: `Total expected payments must equal ${formatCurrency(
                    targetAmount
                )}`,
            })
        } else {
            form.clearErrors('expectedPayments')
        }
    }, [
        totalAmount,
        selectedCourseFee,
        watchSlcStatus,
        watchTuitionFeeAmount,
        watchMaintenanceLoanAmount,
        watchUsingMaintenanceForTuition,
    ])
    useEffect(() => {
        const currentStatus = form.watch('slcStatus')

        // Only reset if status is changing to a new value and there's no saved data
        if (currentStatus && !fData?.slcStatus) {
            // Clear existing payments only if they're not from saved data
            if (!fData?.expectedPayments?.length) {
                while (fields.length > 0) {
                    remove(0)
                }
            }

            setTotalAmount(fData?.paymentStatus?.totalAmount || 0)
            // setPaymentAmounts(fData?.paymentAmounts || {});
            setUseMaintenanceForTuition(
                fData?.usingMaintenanceForTuition || false
            )
            setShowMaintenanceOption(
                currentStatus === 'Approved - Tuition Fees & Maintenance Loan'
            )
            setFeeDifference(null)
            setMaintenanceDifference(null)
            setPaymentStatus({
                difference: fData?.paymentStatus?.difference || 0,
                insufficientTuition: false,
                insufficientMaintenance: false,
            })

            form.clearErrors('expectedPayments')
        }
    }, [watchSlcStatus])

    useEffect(() => {
        const shouldShowFields =
          !isHybridCourse && (watchNationality !== "British" || watchNationality !== "Irish");
        setIsEntryDateRequired(shouldShowFields);
        setIsImmigrationRequired(shouldShowFields);
      }, [isHybridCourse, watchNationality]);

    // console.log(totalAmount)

    const saveForm = () => {
        setHasError(false)

        setError('')
        const stepOneData = form.getValues()

        let shortfall = null

        if (isClicked && !otherOptionText) {
            setError('Please specify where you heard about us.')
            return
        }

        if (stepOneData.countryOfBirth === 'United Kingdom') {
            stepOneData.entryDateToUK = null
        }

        if (stepOneData.nationality === 'British' || stepOneData.nationality === "Irish") {
            stepOneData.immigration_status = null
            stepOneData.share_code = null
        }

        if (stepOneData.tuitionFees === 'Student Loan Company England (SLC)') {
            if (
                stepOneData.slcStatus === 'Approved - Maintenance Loan' &&
                stepOneData.maintenanceLoanAmount &&
                selectedCourseFee &&
                stepOneData.maintenanceLoanAmount < selectedCourseFee
            ) {
                shortfall = {
                    type: 'maintenance',
                    amount:
                        selectedCourseFee - stepOneData.maintenanceLoanAmount,
                    courseFee: selectedCourseFee,
                    approvedAmount: stepOneData.maintenanceLoanAmount,
                    status: stepOneData.slcStatus,
                }
            }

            if (
                (stepOneData.slcStatus === 'Approved - Tuition Fees' ||
                    stepOneData.slcStatus ===
                        'Approved - Tuition Fees & Maintenance Loan') &&
                stepOneData.tuitionFeeAmount &&
                selectedCourseFee &&
                stepOneData.tuitionFeeAmount < selectedCourseFee &&
                !useMaintenanceForTuition
            ) {
                shortfall = {
                    type: 'tuition',
                    amount: selectedCourseFee - stepOneData.tuitionFeeAmount,
                    courseFee: selectedCourseFee,
                    approvedAmount: stepOneData.tuitionFeeAmount,
                    status: stepOneData.slcStatus,
                }
            }
        }

        const currentValues = {
            ...fData,
            ...stepOneData,
            tuitionFees: isClicked ? otherOptionText : stepOneData.tuitionFees,
            shortfall,
            paymentStatus:
                stepOneData.tuitionFees !== 'Student Loan Company England (SLC)'
                    ? {}
                    : {
                          ...paymentStatus,
                          courseFee: selectedCourseFee,
                          totalAmount,
                      },
            courseFee: selectedCourseFee,
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

    console.log('foobar', form.getValues('maintenanceLoanAmount'))

    return (
        <div className="w-full px-5 lg:px-[50px]">
            <FormError message={error} />
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="mt-5">
                    <div className="flex flex-col text-left">
                        <h1 className="font-semibold text-[18px] sm:text-[20px]">
                            Course Details
                        </h1>
                        <span className="text-[12px] sm:text-[14px] text-[#929EAE]">
                            Please enter details related to your course
                        </span>
                    </div>

                    <div className="mt-5">
                        <div className="flex flex-col sm:flex-row justify-center items-start gap-6 sm:gap-10 max-w-5xl mx-auto">
                            <div className="w-full sm:w-1/2">
                                <FormField
                                    control={form.control}
                                    name="courseTitle"
                                    render={({ field }) => (
                                        <FormItem className="w-full">
                                            <FormLabel>Course Title</FormLabel>
                                            <FormControl>
                                                <Select
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    defaultValue={field.value}
                                                    value={field.value}
                                                    disabled={isPending}
                                                >
                                                    <SelectTrigger
                                                        className={
                                                            form.formState
                                                                .errors
                                                                .courseTitle
                                                                ? 'border-red-500'
                                                                : ''
                                                        }
                                                    >
                                                        <SelectValue placeholder="Select a course" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            {courses.map(
                                                                (course) => (
                                                                    <SelectItem
                                                                        className="w-full"
                                                                        key={
                                                                            course.id
                                                                        }
                                                                        value={
                                                                            course.name
                                                                        }
                                                                    >
                                                                        {
                                                                            course.name
                                                                        }
                                                                    </SelectItem>
                                                                )
                                                            )}
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="w-full sm:w-1/2">
                                <FormField
                                    control={form.control}
                                    name="studyMode"
                                    render={({ field }) => (
                                        <FormItem className="w-full">
                                            <FormLabel>Study Mode</FormLabel>
                                            <FormControl>
                                                <Select
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    defaultValue={field.value}
                                                    value={field.value}
                                                    disabled={isPending}
                                                >
                                                    <SelectTrigger
                                                        className={
                                                            form.formState
                                                                .errors
                                                                .studyMode
                                                                ? 'border-red-500'
                                                                : ''
                                                        }
                                                    >
                                                        <SelectValue placeholder="Select an option" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            {studyModes.map(
                                                                (mode) => (
                                                                    <SelectItem
                                                                        key={
                                                                            mode.id
                                                                        }
                                                                        value={
                                                                            mode.study_mode
                                                                        }
                                                                    >
                                                                        {formatStudyMode(
                                                                            mode.study_mode
                                                                        )}
                                                                    </SelectItem>
                                                                )
                                                            )}
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="w-full sm:w-1/2">
                                <FormField
                                    control={form.control}
                                    name="commencement"
                                    render={({ field }) => (
                                        <FormItem className="w-full">
                                            <FormLabel>Commencement</FormLabel>
                                            <FormControl>
                                                <Select
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    defaultValue={field.value}
                                                    value={field.value}
                                                    disabled={isPending}
                                                >
                                                    <SelectTrigger
                                                        className={
                                                            form.formState
                                                                .errors
                                                                .commencement
                                                                ? 'border-red-500'
                                                                : ''
                                                        }
                                                    >
                                                        <SelectValue placeholder="Select an option" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            {courseInstances
                                                                .sort((a, b) =>
                                                                    compareAsc(
                                                                        new Date(
                                                                            a.instance_name
                                                                        ),
                                                                        new Date(
                                                                            b.instance_name
                                                                        )
                                                                    )
                                                                )
                                                                .map(
                                                                    (
                                                                        instance
                                                                    ) => (
                                                                        <SelectItem
                                                                            key={
                                                                                instance.id
                                                                            }
                                                                            value={
                                                                                instance.instance_name
                                                                            }
                                                                        >
                                                                            {
                                                                                instance.instance_name
                                                                            }
                                                                        </SelectItem>
                                                                    )
                                                                )}
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            {!isHybridCourse && (
                                <div className="w-full sm:w-1/2">
                                <FormField
                                    control={form.control}
                                    name="campus"
                                    render={({ field }) => (
                                        <FormItem className="w-full">
                                            <FormLabel>Campus</FormLabel>
                                            <FormControl>
                                                <Select
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    defaultValue={field.value}
                                                    value={field.value}
                                                    disabled={isPending}
                                                >
                                                    <SelectTrigger
                                                        className={
                                                            form.formState
                                                                .errors.campus
                                                                ? 'border-red-500'
                                                                : ''
                                                        }
                                                    >
                                                        <SelectValue placeholder="Select a campus" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="London">
                                                            London
                                                        </SelectItem>
                                                        <SelectItem value="Bristol">
                                                            Bristol
                                                        </SelectItem>
                                                        <SelectItem value="Sheffield">
                                                            Sheffield
                                                        </SelectItem>
                                                        <SelectItem value="Birmingham">
                                                        Birmingham
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            )}
                        </div>
                    </div>

                    {/* Personal Information */}
                    <div className="flex flex-col text-left mt-8 sm:mt-[50px]">
                        <h1 className="font-semibold text-[18px] sm:text-[20px]">
                            Personal Details
                        </h1>
                        <span className="text-[12px] sm:text-[14px] text-[#929EAE]">
                            Please enter your personal information
                        </span>
                    </div>

                    <div className="mt-5 flex justify-center">
                        <div className="w-full max-w-[1160px]">
                            {/* Row 1 - Personal Details */}
                            <div className="flex flex-wrap flex-col sm:flex-row justify-start items-start gap-6 sm:gap-10 sm:flex-nowrap">
                                <div className="w-full sm:w-[290px]">
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem className="w-full">
                                                <FormLabel>Title</FormLabel>
                                                <FormControl>
                                                    <Select
                                                        onValueChange={
                                                            field.onChange
                                                        }
                                                        defaultValue={
                                                            field.value
                                                        }
                                                        value={field.value}
                                                        disabled={isPending}
                                                    >
                                                        <SelectTrigger
                                                            className={cn(
                                                                'lg:w-[290px]',
                                                                form.formState
                                                                    .errors
                                                                    .title &&
                                                                    'border-red-500'
                                                            )}
                                                        >
                                                            <SelectValue placeholder="Select an option" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectGroup>
                                                                <SelectItem value="Mr">
                                                                    Mr
                                                                </SelectItem>
                                                                <SelectItem value="Mrs">
                                                                    Mrs
                                                                </SelectItem>
                                                                <SelectItem value="Ms">
                                                                    Ms
                                                                </SelectItem>
                                                                <SelectItem value="Miss">
                                                                    Miss
                                                                </SelectItem>
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="w-full sm:w-[400px]">
                                    <FormField
                                        control={form.control}
                                        name="firstName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    First Name
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type="text"
                                                        className={cn(
                                                            'w-full',
                                                            form.formState
                                                                .errors
                                                                .firstName &&
                                                                'border-red-500'
                                                        )}
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
                                        name="lastName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Last Name</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type="text"
                                                        className={cn(
                                                            'w-full',
                                                            form.formState
                                                                .errors
                                                                .lastName &&
                                                                'border-red-500'
                                                        )}
                                                        disabled={isPending}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Row 2 - Profile Photo Upload */}
                            <div className="mt-6">
                                <Label className="underline">
                                    Profile Photo Upload
                                </Label>
                                <PhotoGuidelines
                                    setIsModalOpen={setIsModalOpen}
                                />
                                <MultiUploader
                                    onChange={(file, removed) => {
                                        setFile(file)
                                        setIsRemoved(removed)

                                        const newAccumulatedFiles = {
                                            ...accumulatedFiles,
                                        }
                                        newAccumulatedFiles.file = {
                                            file,
                                            alreadyExists: false,
                                        }
                                        setAccumulatedFiles(newAccumulatedFiles)
                                    }}
                                    defaultFile={
                                        accumulatedFiles.file?.file || file
                                    }
                                    defaultPreviewUrl={
                                        accumulatedFiles.file?.alreadyExists
                                            ? application?.photoUrl
                                            : accumulatedFiles.file?.file
                                            ? URL.createObjectURL(
                                                  accumulatedFiles.file.file
                                              )
                                            : null
                                    }
                                    isPending={isPending}
                                    fileType="image"
                                />
                                <Dialog
                                    open={isModalOpen}
                                    onOpenChange={setIsModalOpen}
                                >
                                    <DialogContent className="sm:max-w-[600px]">
                                        <DialogHeader>
                                            <DialogTitle>
                                                Profile Photo Guidelines
                                            </DialogTitle>
                                            <DialogDescription />
                                        </DialogHeader>
                                        <ScrollArea className="max-h-[80vh] pr-4">
                                            <div className="space-y-4">
                                                <h5 className="font-medium">
                                                    What your digital photo must
                                                    show
                                                </h5>
                                                <p className="text-sm text-muted-foreground">
                                                    The digital photo must:
                                                </p>
                                                <ul className="text-sm text-muted-foreground list-disc list-inside">
                                                    <li>
                                                        contain no other objects
                                                        or people
                                                    </li>
                                                    <li>
                                                        be taken against a plain
                                                        light-coloured
                                                        background
                                                    </li>
                                                    <li>
                                                        be in clear contrast to
                                                        the background
                                                    </li>
                                                    <li>
                                                        not have &apos;red
                                                        eye&apos;
                                                    </li>
                                                </ul>
                                                <p className="text-sm text-muted-foreground">
                                                    If you&apos;re using a photo
                                                    taken on your own device,
                                                    include your head, shoulders
                                                    and upper body. Do not crop
                                                    your photo - it will be done
                                                    for you.
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    In your photo you must:
                                                </p>
                                                <ul className="text-sm text-muted-foreground list-disc list-inside">
                                                    <li>
                                                        be facing forwards and
                                                        looking straight at the
                                                        camera
                                                    </li>
                                                    <li>
                                                        have a plain expression
                                                        and your mouth closed
                                                    </li>
                                                    <li>
                                                        have your eyes open and
                                                        visible
                                                    </li>
                                                    <li>
                                                        not have hair in front
                                                        of your eyes
                                                    </li>
                                                    <li>
                                                        not have a head covering
                                                        (unless it&apos;s for
                                                        religious or medical
                                                        reasons)
                                                    </li>
                                                    <li>
                                                        not have anything
                                                        covering your face
                                                    </li>
                                                    <li>
                                                        not have any shadows on
                                                        your face or behind you
                                                    </li>
                                                </ul>
                                                <p className="text-sm text-muted-foreground">
                                                    Do not wear glasses in your
                                                    photo unless you have to do
                                                    so. If you must wear
                                                    glasses, they cannot be
                                                    sunglasses or tinted
                                                    glasses, and you must make
                                                    sure your eyes are not
                                                    covered by the frames or any
                                                    glare, reflection or shadow.
                                                </p>

                                                <Image
                                                    src="/photo-guidance.jpeg"
                                                    alt="Photo guidelines"
                                                    width={500}
                                                    height={0}
                                                    sizes="100vw"
                                                    style={{
                                                        width: '100%',
                                                        height: 'auto',
                                                    }}
                                                />
                                            </div>
                                        </ScrollArea>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            {/* Row 3 */}
                            <div className="flex flex-wrap flex-col sm:flex-row justify-start items-start gap-6 sm:gap-10 sm:flex-nowrap mt-6">
                                <div className="w-full sm:w-[290px]">
                                    <FormField
                                        control={form.control}
                                        name="gender"
                                        render={({ field }) => (
                                            <FormItem className="w-full">
                                                <FormLabel>Gender</FormLabel>
                                                <FormControl>
                                                    <Select
                                                        onValueChange={
                                                            field.onChange
                                                        }
                                                        defaultValue={
                                                            field.value
                                                        }
                                                        value={field.value}
                                                        disabled={isPending}
                                                    >
                                                        <SelectTrigger
                                                            className={cn(
                                                                'lg:w-[290px]',
                                                                form.formState
                                                                    .errors
                                                                    .gender &&
                                                                    'border-red-500'
                                                            )}
                                                        >
                                                            <SelectValue placeholder="Select an option" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectGroup>
                                                                <SelectItem value="Male">
                                                                    Male
                                                                </SelectItem>
                                                                <SelectItem value="Female">
                                                                    Female
                                                                </SelectItem>
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="w-full sm:w-[290px]">
                                    <FormField
                                        control={form.control}
                                        name="dateOfBirth"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Date of Birth
                                                </FormLabel>
                                                <FormControl>
                                                    <Popover>
                                                        <PopoverTrigger
                                                            asChild
                                                            className={
                                                                form.formState
                                                                    .errors
                                                                    .dateOfBirth &&
                                                                'border-red-500'
                                                            }
                                                        >
                                                            <Button
                                                                variant={
                                                                    'outline'
                                                                }
                                                                className={cn(
                                                                    'w-full justify-start text-left font-normal h-12 rounded-[10px] px-[25px]',
                                                                    !field.value &&
                                                                        'text-muted-foreground'
                                                                )}
                                                                disabled={
                                                                    isPending
                                                                }
                                                            >
                                                                {field.value ? (
                                                                    format(
                                                                        new Date(
                                                                            field.value
                                                                        ),
                                                                        'dd-MM-yyyy'
                                                                    )
                                                                ) : (
                                                                    <span>
                                                                        Pick a
                                                                        date
                                                                    </span>
                                                                )}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0">
                                                            <Calendar
                                                                mode="single"
                                                                selected={
                                                                    new Date(
                                                                        field.value
                                                                    )
                                                                }
                                                                captionLayout="dropdown-buttons"
                                                                fromYear={1920}
                                                                toYear={now.getFullYear()}
                                                                onSelect={(
                                                                    date
                                                                ) =>
                                                                    field.onChange(
                                                                        new Date(
                                                                            date
                                                                        )
                                                                    )
                                                                }
                                                                disabled={(
                                                                    date
                                                                ) =>
                                                                    date >
                                                                        new Date() ||
                                                                    date <
                                                                        new Date(
                                                                            '1900-01-01'
                                                                        )
                                                                }
                                                                initialFocus
                                                                weekStartsOn={1}
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="w-full sm:w-[400px]">
                                    <FormField
                                        control={form.control}
                                        name="placeOfBirth"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Place of Birth (City/Town)
                                                </FormLabel>
                                                <FormControl>
                                                    <PlaceOfBirthInput
                                                        {...field}
                                                        defaultValue={
                                                            application?.placeOfBirth
                                                        }
                                                        onPlaceSelect={
                                                            handlePlaceSelect
                                                        }
                                                        className={cn(
                                                            form.formState
                                                                .errors
                                                                .placeOfBirth &&
                                                                'border-red-500'
                                                        )}
                                                        disabled={isPending}
                                                    />
                                                </FormControl>
                                                {detectedCountry &&
                                                    field.value !==
                                                        detectedCountry && (
                                                        <p className="text-yellow-500 text-sm absolute">
                                                            Detected country:{' '}
                                                            {detectedCountry}
                                                        </p>
                                                    )}
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Row 4 */}
                            <div className="flex flex-wrap flex-col sm:flex-row justify-start items-start gap-6 sm:gap-10 sm:flex-nowrap mt-6">
                                <div className="w-full sm:w-[290px]">
                                    <FormField
                                        control={form.control}
                                        name="countryOfBirth"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Country of Birth
                                                </FormLabel>
                                                <FormControl>
                                                    <Select
                                                        onValueChange={
                                                            field.onChange
                                                        }
                                                        defaultValue={
                                                            field.value
                                                        }
                                                        value={field.value}
                                                        disabled={isPending}
                                                    >
                                                        <SelectTrigger
                                                            className={cn(
                                                                detectedCountry &&
                                                                    field.value !==
                                                                        detectedCountry &&
                                                                    'border-yellow-500',
                                                                form.formState
                                                                    .errors
                                                                    .countryOfBirth &&
                                                                    'border-red-500'
                                                            )}
                                                        >
                                                            <SelectValue placeholder="Select an option" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectGroup>
                                                                <SelectLabel>
                                                                    Popular
                                                                    Countries
                                                                </SelectLabel>
                                                                {popularCountries.map(
                                                                    (
                                                                        country
                                                                    ) => (
                                                                        <SelectItem
                                                                            key={
                                                                                country
                                                                            }
                                                                            value={
                                                                                country
                                                                            }
                                                                        >
                                                                            {
                                                                                country
                                                                            }
                                                                        </SelectItem>
                                                                    )
                                                                )}
                                                            </SelectGroup>
                                                            <SelectSeparator />
                                                            <SelectGroup>
                                                                <SelectLabel>
                                                                    All
                                                                    Countries
                                                                </SelectLabel>
                                                                {Object.entries(
                                                                    countries.getNames(
                                                                        'en'
                                                                    )
                                                                )
                                                                    .filter(
                                                                        ([
                                                                            code,
                                                                            name,
                                                                        ]) =>
                                                                            !popularCountries.includes(
                                                                                name
                                                                            )
                                                                    )
                                                                    .map(
                                                                        ([
                                                                            code,
                                                                            name,
                                                                        ]) => (
                                                                            <SelectItem
                                                                                key={
                                                                                    code
                                                                                }
                                                                                value={
                                                                                    name
                                                                                }
                                                                            >
                                                                                {
                                                                                    name
                                                                                }
                                                                            </SelectItem>
                                                                        )
                                                                    )}
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="w-full sm:w-[290px]">
                                    <FormField
                                        control={form.control}
                                        name="nationality"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Nationality
                                                </FormLabel>
                                                <FormControl>
                                                    <Select
                                                        onValueChange={(
                                                            value
                                                        ) => {
                                                            field.onChange(
                                                                value
                                                            )
                                                            setIsImmigrationRequired(
                                                                value !==
                                                                    'British' || value !== "Irish"
                                                            )
                                                        }}
                                                        defaultValue={
                                                            field.value
                                                        }
                                                        value={field.value}
                                                        disabled={isPending}
                                                    >
                                                        <SelectTrigger
                                                            className={cn(
                                                                form.formState
                                                                    .errors
                                                                    .nationality &&
                                                                    'border-red-500'
                                                            )}
                                                        >
                                                            <SelectValue placeholder="Select an option" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectGroup>
                                                                <SelectLabel>
                                                                    Popular
                                                                    Nationalities
                                                                </SelectLabel>
                                                                {popularNationalities.map(
                                                                    (
                                                                        nationality
                                                                    ) => (
                                                                        <SelectItem
                                                                            key={
                                                                                nationality
                                                                            }
                                                                            value={
                                                                                nationality
                                                                            }
                                                                        >
                                                                            {
                                                                                nationality
                                                                            }
                                                                        </SelectItem>
                                                                    )
                                                                )}
                                                            </SelectGroup>
                                                            <SelectSeparator />
                                                            <SelectGroup>
                                                                <SelectLabel>
                                                                    All
                                                                    Countries
                                                                </SelectLabel>
                                                                {Object.entries(
                                                                    nationalities.getNames(
                                                                        'en'
                                                                    )
                                                                )
                                                                    .filter(
                                                                        ([
                                                                            code,
                                                                            nationality,
                                                                        ]) =>
                                                                            !popularNationalities.includes(
                                                                                nationality
                                                                            )
                                                                    )
                                                                    .sort(
                                                                        (
                                                                            a,
                                                                            b
                                                                        ) =>
                                                                            a[1].localeCompare(
                                                                                b[1]
                                                                            )
                                                                    )
                                                                    .map(
                                                                        ([
                                                                            code,
                                                                            nationality,
                                                                        ]) => (
                                                                            <SelectItem
                                                                                key={
                                                                                    code
                                                                                }
                                                                                value={
                                                                                    nationality
                                                                                }
                                                                            >
                                                                                {
                                                                                    nationality
                                                                                }
                                                                            </SelectItem>
                                                                        )
                                                                    )}
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                {isEntryDateRequired && (
                                    <div className="w-full sm:w-[290px]">
                                        <FormField
                                            control={form.control}
                                            name="entryDateToUK"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Entry Date to UK
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Popover>
                                                            <PopoverTrigger
                                                                asChild
                                                                className={
                                                                    form
                                                                        .formState
                                                                        .errors
                                                                        .entryDateToUK &&
                                                                    'border-red-500'
                                                                }
                                                            >
                                                                <Button
                                                                    variant={
                                                                        'outline'
                                                                    }
                                                                    className={cn(
                                                                        'w-full justify-start text-left font-normal h-12 rounded-[10px] px-[25px]',
                                                                        !field.value &&
                                                                            'text-muted-foreground'
                                                                    )}
                                                                    disabled={
                                                                        isPending
                                                                    }
                                                                >
                                                                    {field.value ? (
                                                                        format(
                                                                            new Date(
                                                                                field.value
                                                                            ),
                                                                            'dd-MM-yyyy'
                                                                        )
                                                                    ) : (
                                                                        <span>
                                                                            Pick
                                                                            a
                                                                            date
                                                                        </span>
                                                                    )}
                                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0">
                                                                <Calendar
                                                                    mode="single"
                                                                    selected={
                                                                        new Date(
                                                                            field.value
                                                                        )
                                                                    }
                                                                    captionLayout="dropdown-buttons"
                                                                    fromYear={
                                                                        1920
                                                                    }
                                                                    toYear={now.getFullYear()}
                                                                    onSelect={(
                                                                        date
                                                                    ) =>
                                                                        field.onChange(
                                                                            new Date(
                                                                                date
                                                                            )
                                                                        )
                                                                    }
                                                                    disabled={(
                                                                        date
                                                                    ) =>
                                                                        date >
                                                                            new Date() ||
                                                                        date <
                                                                            new Date(
                                                                                '1900-01-01'
                                                                            )
                                                                    }
                                                                    initialFocus
                                                                    weekStartsOn={
                                                                        1
                                                                    }
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Row 5 */}
                            <div className="flex flex-wrap flex-col sm:flex-row justify-start items-start gap-6 sm:gap-10 sm:flex-nowrap mt-6">
                                {isImmigrationRequired && (
                                    <>
                                        <div className="w-full sm:w-[290px]">
                                            <FormField
                                                control={form.control}
                                                name="immigration_status"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Immigration Status
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Select
                                                                onValueChange={
                                                                    field.onChange
                                                                }
                                                                defaultValue={
                                                                    field.value
                                                                }
                                                                value={
                                                                    field.value
                                                                }
                                                                disabled={
                                                                    isPending
                                                                }
                                                            >
                                                                <SelectTrigger
                                                                    className={cn(
                                                                        form
                                                                            .formState
                                                                            .errors
                                                                            .immigration_status &&
                                                                            'border-red-500'
                                                                    )}
                                                                >
                                                                    <SelectValue placeholder="Select an option" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectGroup>
                                                                        <SelectItem value="settled">
                                                                            Settled
                                                                            (Indefinite
                                                                            Leave)
                                                                        </SelectItem>
                                                                        <SelectItem value="pre_settled">
                                                                            Pre
                                                                            Settled
                                                                            (Limited
                                                                            Leave)
                                                                        </SelectItem>
                                                                    </SelectGroup>
                                                                </SelectContent>
                                                            </Select>
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {isShareCodeRequired && (
                                            <div className="w-full sm:w-[290px]">
                                                <FormField
                                                    control={form.control}
                                                    name="share_code"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Share Code
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    type="text"
                                                                    placeholder="Eg. XXX XXX XXX"
                                                                    className={cn(
                                                                        form
                                                                            .formState
                                                                            .errors
                                                                            .share_code &&
                                                                            'border-red-500'
                                                                    )}
                                                                    disabled={
                                                                        isPending
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) => {
                                                                        const value =
                                                                            e.target.value
                                                                                .toUpperCase()
                                                                                .replace(
                                                                                    /[^A-Z0-9]/g,
                                                                                    ''
                                                                                )
                                                                        const formattedValue =
                                                                            value
                                                                                .replace(
                                                                                    /(.{3})/g,
                                                                                    '$1 '
                                                                                )
                                                                                .trim()
                                                                        field.onChange(
                                                                            formattedValue
                                                                        )
                                                                    }}
                                                                    maxLength={
                                                                        11
                                                                    }
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        )}
                                    </>
                                )}

                                <div className="w-full sm:w-[400px]">
                                    <FormField
                                        control={form.control}
                                        name="identificationNo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Passport / National ID Card
                                                    No.
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type="text"
                                                        className={cn(
                                                            form.formState
                                                                .errors
                                                                .identificationNo &&
                                                                'border-red-500'
                                                        )}
                                                        disabled={isPending}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Row 6 */}
                            {isImmigrationRequired && !isLoading && (
                                <div className="mt-6 space-y-2">
                                    <Label className="underline">
                                        Immigration Document Upload
                                    </Label>
                                    <MultiUploader
                                        onChange={(file, removed) => {
                                            setImmigrationFile(file)
                                            setIsRemoved(removed)

                                            const newAccumulatedFiles = {
                                                ...accumulatedFiles,
                                            }
                                            newAccumulatedFiles.immigrationFile =
                                                {
                                                    file,
                                                    alreadyExists: false,
                                                }
                                            setAccumulatedFiles(
                                                newAccumulatedFiles
                                            )
                                        }}
                                        defaultFile={
                                            accumulatedFiles.immigrationFile
                                                ?.file || immigrationFile
                                        }
                                        defaultPreviewUrl={
                                            accumulatedFiles.immigrationFile
                                                ?.alreadyExists
                                                ? application?.immigration_url
                                                : accumulatedFiles
                                                      .immigrationFile?.file
                                                ? URL.createObjectURL(
                                                      accumulatedFiles
                                                          .immigrationFile.file
                                                  )
                                                : null
                                        }
                                        isPending={isPending}
                                        fileType="file"
                                    />
                                </div>
                            )}

                            {/* Row 7 */}
                            {!isLoading && (
                                <div className="mt-6 space-y-2">
                                    <Label className="underline">
                                        Passport / National ID Card Upload
                                    </Label>
                                    <MultiUploader
                                        onChange={(file, removed) => {
                                            setIdFile(file)
                                            setIsRemoved(removed)

                                            const newAccumulatedFiles = {
                                                ...accumulatedFiles,
                                            }
                                            newAccumulatedFiles.idFile = {
                                                file,
                                                alreadyExists: false,
                                            }
                                            setAccumulatedFiles(
                                                newAccumulatedFiles
                                            )
                                        }}
                                        defaultFile={
                                            accumulatedFiles.idFile?.file ||
                                            idFile
                                        }
                                        defaultPreviewUrl={
                                            accumulatedFiles.idFile
                                                ?.alreadyExists
                                                ? application?.identificationNoUrl
                                                : accumulatedFiles.idFile?.file
                                                ? URL.createObjectURL(
                                                      accumulatedFiles.idFile
                                                          .file
                                                  )
                                                : null
                                        }
                                        isPending={isPending}
                                        fileType="image"
                                    />
                                </div>
                            )}

                            {/* Row 8 */}
                            <div className="flex flex-wrap flex-col sm:flex-row justify-start items-start gap-6 sm:gap-10 sm:flex-nowrap mt-6">
                                <div className="w-full sm:w-1/2">
                                    <FormField
                                        control={form.control}
                                        name="addressLine1"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Address Line 1
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type="text"
                                                        disabled={isPending}
                                                        className={
                                                            form.formState
                                                                .errors
                                                                .addressLine1 &&
                                                            'border-red-500'
                                                        }
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="w-full sm:w-1/2">
                                    <FormField
                                        control={form.control}
                                        name="addressLine2"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Address Line 2
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type="text"
                                                        disabled={isPending}
                                                        className={
                                                            form.formState
                                                                .errors
                                                                .addressLine2 &&
                                                            'border-red-500'
                                                        }
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Row 9 */}
                            <div className="flex flex-wrap flex-col sm:flex-row justify-start items-start gap-6 sm:gap-10 sm:flex-nowrap mt-6">
                                <div className="w-full">
                                    <FormField
                                        control={form.control}
                                        name="city"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Town/City</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type="text"
                                                        disabled={isPending}
                                                        className={
                                                            form.formState
                                                                .errors.city &&
                                                            'border-red-500'
                                                        }
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="w-full">
                                    <FormField
                                        control={form.control}
                                        name="postcode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Zip/Post code
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        onChange={(e) => {
                                                            let value =
                                                                e.target.value
                                                                    .toUpperCase()
                                                                    .replace(
                                                                        /\s/g,
                                                                        ''
                                                                    )
                                                            if (
                                                                value.length > 4
                                                            ) {
                                                                value =
                                                                    value.slice(
                                                                        0,
                                                                        -3
                                                                    ) +
                                                                    ' ' +
                                                                    value.slice(
                                                                        -3
                                                                    )
                                                            }
                                                            field.onChange(
                                                                value
                                                            )
                                                        }}
                                                        type="text"
                                                        disabled={isPending}
                                                        className={
                                                            form.formState
                                                                .errors
                                                                .postcode &&
                                                            'border-red-500'
                                                        }
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="w-full">
                                    <FormField
                                        control={form.control}
                                        name="homeTelephoneNo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Home Telephone No.
                                                </FormLabel>
                                                <FormControl className="w-full">
                                                    <PhoneInput
                                                        {...field}
                                                        disabled={isPending}
                                                        hasError={
                                                            !!form.formState
                                                                .errors.mobileNo
                                                        }
                                                        className={
                                                            form.formState
                                                                .errors
                                                                .homeTelephoneNo &&
                                                            'border-red-500'
                                                        }
                                                        international
                                                        defaultCountry="GB"
                                                    />
                                                </FormControl>
                                                <FormDescription className="text-xs italic text-muted-foreground">
                                                    Select country code from
                                                    dropdown or enter manually
                                                </FormDescription>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Row 10 */}
                            <div className="flex flex-wrap flex-col sm:flex-row justify-start items-start gap-6 sm:gap-10 sm:flex-nowrap mt-5">
                                <div className="w-full sm:w-[360px]">
                                    <FormField
                                        control={form.control}
                                        name="mobileNo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Mobile No.
                                                </FormLabel>
                                                <FormControl className="w-full">
                                                    <PhoneInput
                                                        {...field}
                                                        disabled={isPending}
                                                        formError={
                                                            !!form.formState
                                                                .errors.mobileNo
                                                        }
                                                        international
                                                        defaultCountry="GB"
                                                    />
                                                </FormControl>
                                                <FormDescription className="text-xs italic text-muted-foreground">
                                                    Select country code from
                                                    dropdown or enter manually
                                                </FormDescription>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="w-full sm:w-[400px]">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type="text"
                                                        disabled={isPending}
                                                        className={
                                                            form.formState
                                                                .errors.email &&
                                                            'border-red-500'
                                                        }
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="w-full sm:w-[400px]">
                                    <FormField
                                        control={form.control}
                                        name="emergency_contact_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Emergency Contact Name
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type="text"
                                                        disabled={isPending}
                                                        className={
                                                            form.formState
                                                                .errors
                                                                .emergency_contact_name &&
                                                            'border-red-500'
                                                        }
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Row 11 */}
                            <div className="flex flex-wrap flex-col sm:flex-row justify-start items-start gap-6 sm:gap-10 sm:flex-nowrap mt-4">
                                <div className="w-full sm:w-[360px]">
                                    <FormField
                                        control={form.control}
                                        name="emergency_contact_no"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Emergency Contact Number
                                                </FormLabel>
                                                <FormControl className="w-full">
                                                    <PhoneInput
                                                        {...field}
                                                        disabled={isPending}
                                                        formError={
                                                            !!form.formState
                                                                .errors
                                                                .emergency_contact_no
                                                        }
                                                        international
                                                        defaultCountry="GB"
                                                    />
                                                </FormControl>
                                                <FormDescription className="text-xs italic text-muted-foreground">
                                                    Select country code from
                                                    dropdown or enter manually
                                                </FormDescription>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Row 12 */}
                            <div className="flex flex-wrap flex-col sm:flex-row justify-start items-start gap-6 sm:gap-10 sm:flex-nowrap mt-6">
                                <div className="w-full">
                                    <FormField
                                        control={form.control}
                                        name="tuitionFees"
                                        render={({ field }) => (
                                            <FormItem>
                                                <div className="flex flex-col space-y-[5px]">
                                                    <FormLabel>
                                                        Tuition Fees
                                                    </FormLabel>
                                                    <FormDescription>
                                                        How will you fund your
                                                        studies?
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <RadioGroup
                                                        onValueChange={(
                                                            value
                                                        ) => {
                                                            field.onChange(
                                                                value
                                                            )
                                                            setSlcSelected(
                                                                value ===
                                                                    'Student Loan Company England (SLC)'
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

                                                            if (
                                                                value !==
                                                                'Student Loan Company England (SLC)'
                                                            ) {
                                                                setPaymentStatus(
                                                                    {}
                                                                )
                                                                form.reset({
                                                                    ...form.getValues(),
                                                                    appliedForCourse:
                                                                        undefined,
                                                                    slcStatus:
                                                                        undefined,
                                                                    crn: '',
                                                                    courseFee:
                                                                        undefined,
                                                                    previousFundingYear:
                                                                        undefined,
                                                                    previouslyReceivedFunds:
                                                                        undefined,
                                                                    tuitionFeeAmount:
                                                                        undefined,
                                                                    maintenanceLoanAmount:
                                                                        undefined,
                                                                    hasSlcAccount:
                                                                        undefined,
                                                                    ssn: '',
                                                                    expectedPayments:
                                                                        [],
                                                                })
                                                            }
                                                        }}
                                                        value={
                                                            isClicked
                                                                ? 'Other'
                                                                : field.value
                                                        }
                                                        className="flex flex-col space-y-1"
                                                        disabled={isPending}
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
                                                            <FormLabel className="font-medium">
                                                                Self
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
                                                                    onChange={(
                                                                        e
                                                                    ) => {
                                                                        setOtherOptionText(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }}
                                                                    value={
                                                                        otherOptionText
                                                                    }
                                                                    type="text"
                                                                    className={cn(
                                                                        'lg:max-w-[400px]',
                                                                        hasError &&
                                                                            'border-red-500'
                                                                    )}
                                                                />
                                                            </FormControl>
                                                        )}
                                                        {!isHybridCourse && (
                                                            <FormItem className="flex items-center space-x-3 space-y-0">
                                                            <FormControl>
                                                                <RadioGroupItem value="Student Loan Company England (SLC)" />
                                                            </FormControl>
                                                            <FormLabel className="font-medium">
                                                                Student Loan
                                                                Company England
                                                                (SLC)
                                                            </FormLabel>
                                                        </FormItem>
                                                        )}

                                                        {slcSelected && (
                                                            <div className="space-y-6 pb-4">
                                                                <FormField
                                                                    control={
                                                                        form.control
                                                                    }
                                                                    name="hasSlcAccount"
                                                                    render={({
                                                                        field,
                                                                    }) => (
                                                                        <FormItem className="space-y-3">
                                                                            <FormLabel>
                                                                                Do
                                                                                you
                                                                                have
                                                                                an
                                                                                account
                                                                                with
                                                                                the
                                                                                Student
                                                                                Loan
                                                                                Company
                                                                                (SLC)?
                                                                            </FormLabel>
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
                                                                                            'No'
                                                                                        ) {
                                                                                            // Reset related fields
                                                                                            form.reset(
                                                                                                {
                                                                                                    ...form.getValues(),
                                                                                                    previouslyReceivedFunds:
                                                                                                        undefined,
                                                                                                    previousFundingYear:
                                                                                                        undefined,
                                                                                                    appliedForCourse:
                                                                                                        undefined,
                                                                                                    crn: '',
                                                                                                    slcStatus:
                                                                                                        undefined,
                                                                                                    courseFee:
                                                                                                        undefined,
                                                                                                    tuitionFeeAmount:
                                                                                                        undefined,
                                                                                                    maintenanceLoanAmount:
                                                                                                        undefined,
                                                                                                    ssn: '',
                                                                                                    expectedPayments:
                                                                                                        [],
                                                                                                }
                                                                                            )
                                                                                        }
                                                                                    }}
                                                                                    disabled={
                                                                                        isPending
                                                                                    }
                                                                                    value={
                                                                                        field.value
                                                                                    }
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

                                                                {form.watch(
                                                                    'hasSlcAccount'
                                                                ) === 'Yes' && (
                                                                    <>
                                                                        <FormField
                                                                            control={
                                                                                form.control
                                                                            }
                                                                            name="previouslyReceivedFunds"
                                                                            render={({
                                                                                field,
                                                                            }) => (
                                                                                <FormItem className="space-y-3">
                                                                                    <FormLabel>
                                                                                        Have
                                                                                        you
                                                                                        previously
                                                                                        received
                                                                                        funds
                                                                                        from
                                                                                        SLC?
                                                                                    </FormLabel>
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
                                                                                                    'No'
                                                                                                ) {
                                                                                                    form.setValue(
                                                                                                        'previousFundingYear',
                                                                                                        undefined
                                                                                                    )
                                                                                                }
                                                                                            }}
                                                                                            disabled={
                                                                                                isPending
                                                                                            }
                                                                                            value={
                                                                                                field.value
                                                                                            }
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

                                                                        {form.watch(
                                                                            'previouslyReceivedFunds'
                                                                        ) ===
                                                                            'Yes' && (
                                                                            <FormField
                                                                                control={
                                                                                    form.control
                                                                                }
                                                                                name="previousFundingYear"
                                                                                render={({
                                                                                    field,
                                                                                }) => (
                                                                                    <FormItem>
                                                                                        <FormLabel>
                                                                                            During
                                                                                            which
                                                                                            academic
                                                                                            year
                                                                                            did
                                                                                            you
                                                                                            receive
                                                                                            funding?
                                                                                        </FormLabel>
                                                                                        <FormControl>
                                                                                            <Select
                                                                                                onValueChange={
                                                                                                    field.onChange
                                                                                                }
                                                                                                value={
                                                                                                    field.value
                                                                                                }
                                                                                                disabled={
                                                                                                    isPending
                                                                                                }
                                                                                            >
                                                                                                <FormControl>
                                                                                                    <SelectTrigger>
                                                                                                        <SelectValue placeholder="Select academic year" />
                                                                                                    </SelectTrigger>
                                                                                                </FormControl>
                                                                                                <SelectContent>
                                                                                                    {/* Add last 5 academic years */}
                                                                                                    {Array.from(
                                                                                                        {
                                                                                                            length: 20,
                                                                                                        },
                                                                                                        (
                                                                                                            _,
                                                                                                            i
                                                                                                        ) => {
                                                                                                            const year =
                                                                                                                new Date().getFullYear() -
                                                                                                                i
                                                                                                            return (
                                                                                                                <SelectItem
                                                                                                                    key={
                                                                                                                        year
                                                                                                                    }
                                                                                                                    value={`${
                                                                                                                        year -
                                                                                                                        1
                                                                                                                    }/${year}`}
                                                                                                                >
                                                                                                                    {year -
                                                                                                                        1}

                                                                                                                    /
                                                                                                                    {
                                                                                                                        year
                                                                                                                    }
                                                                                                                </SelectItem>
                                                                                                            )
                                                                                                        }
                                                                                                    )}
                                                                                                </SelectContent>
                                                                                            </Select>
                                                                                        </FormControl>
                                                                                        <FormMessage />
                                                                                    </FormItem>
                                                                                )}
                                                                            />
                                                                        )}

                                                                        <FormField
                                                                            control={
                                                                                form.control
                                                                            }
                                                                            name="appliedForCourse"
                                                                            render={({
                                                                                field,
                                                                            }) => (
                                                                                <FormItem className="space-y-3">
                                                                                    <FormLabel>
                                                                                        Have
                                                                                        you
                                                                                        applied
                                                                                        for
                                                                                        SLC
                                                                                        funding
                                                                                        for
                                                                                        this
                                                                                        course?
                                                                                    </FormLabel>
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
                                                                                                    'No'
                                                                                                ) {
                                                                                                    form.reset(
                                                                                                        {
                                                                                                            ...form.getValues(),
                                                                                                            crn: '',
                                                                                                            slcStatus:
                                                                                                                undefined,
                                                                                                            tuitionFeeAmount:
                                                                                                                undefined,
                                                                                                            maintenanceLoanAmount:
                                                                                                                undefined,
                                                                                                            ssn: '',
                                                                                                            expectedPayments:
                                                                                                                [],
                                                                                                        }
                                                                                                    )
                                                                                                }
                                                                                            }}
                                                                                            disabled={
                                                                                                isPending
                                                                                            }
                                                                                            value={
                                                                                                field.value
                                                                                            }
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
                                                                    </>
                                                                )}

                                                                {form.watch(
                                                                    'appliedForCourse'
                                                                ) === 'Yes' && (
                                                                    <div className="space-y-6">
                                                                        <FormField
                                                                            control={
                                                                                form.control
                                                                            }
                                                                            name="crn"
                                                                            render={({
                                                                                field,
                                                                            }) => (
                                                                                <FormItem className="w-full md:w-fit">
                                                                                    <FormLabel>
                                                                                        Customer
                                                                                        Reference
                                                                                        Number
                                                                                        (CRN)
                                                                                    </FormLabel>
                                                                                    <FormControl>
                                                                                        <Input
                                                                                            {...field}
                                                                                            disabled={
                                                                                                isPending
                                                                                            }
                                                                                            placeholder="Enter your CRN"
                                                                                            value={
                                                                                                field.value?.trim() ||
                                                                                                ''
                                                                                            }
                                                                                        />
                                                                                    </FormControl>
                                                                                    <FormMessage />
                                                                                </FormItem>
                                                                            )}
                                                                        />

                                                                        <FormField
                                                                            control={
                                                                                form.control
                                                                            }
                                                                            name="slcStatus"
                                                                            render={({
                                                                                field,
                                                                            }) => (
                                                                                <FormItem className="w-full md:w-fit">
                                                                                    <FormLabel>
                                                                                        Application
                                                                                        Status
                                                                                    </FormLabel>
                                                                                    <Select
                                                                                        onValueChange={(
                                                                                            value
                                                                                        ) => {
                                                                                            field.onChange(
                                                                                                value
                                                                                            )
                                                                                            // Reset only SLC-related fields when changing status
                                                                                            const currentValues =
                                                                                                form.getValues()
                                                                                            form.reset(
                                                                                                {
                                                                                                    ...currentValues,
                                                                                                    tuitionFeeAmount:
                                                                                                        undefined,
                                                                                                    maintenanceLoanAmount:
                                                                                                        undefined,
                                                                                                    ssn: '',
                                                                                                    expectedPayments:
                                                                                                        [],
                                                                                                    usingMaintenanceForTuition: false,
                                                                                                }
                                                                                            )
                                                                                            setPaymentStatus(
                                                                                                {}
                                                                                            )
                                                                                            setShowMaintenanceOption(
                                                                                                false
                                                                                            )
                                                                                            setTotalAmount(
                                                                                                0
                                                                                            )
                                                                                            // setPaymentAmounts({});
                                                                                        }}
                                                                                        value={
                                                                                            field.value
                                                                                        }
                                                                                        disabled={
                                                                                            isPending
                                                                                        }
                                                                                    >
                                                                                        <FormControl>
                                                                                            <SelectTrigger>
                                                                                                <SelectValue placeholder="Select status" />
                                                                                            </SelectTrigger>
                                                                                        </FormControl>
                                                                                        <SelectContent>
                                                                                            <SelectItem value="Approved - Tuition Fees & Maintenance Loan">
                                                                                                Approved
                                                                                                -
                                                                                                Tuition
                                                                                                Fees
                                                                                                &
                                                                                                Maintenance
                                                                                                Loan
                                                                                            </SelectItem>
                                                                                            <SelectItem value="Approved - Tuition Fees">
                                                                                                Approved
                                                                                                -
                                                                                                Tuition
                                                                                                Fees
                                                                                            </SelectItem>
                                                                                            <SelectItem value="Approved - Maintenance Loan">
                                                                                                Approved
                                                                                                -
                                                                                                Maintenance
                                                                                                Loan
                                                                                            </SelectItem>
                                                                                            <SelectItem value="Rejected">
                                                                                                Rejected
                                                                                            </SelectItem>
                                                                                            <SelectItem value="In-process">
                                                                                                In-process
                                                                                            </SelectItem>
                                                                                        </SelectContent>
                                                                                    </Select>
                                                                                    <FormMessage />
                                                                                </FormItem>
                                                                            )}
                                                                        />

                                                                        {form
                                                                            .watch(
                                                                                'slcStatus'
                                                                            )
                                                                            ?.startsWith(
                                                                                'Approved'
                                                                            ) && (
                                                                            <div className="space-y-6">
                                                                                {(form.watch(
                                                                                    'slcStatus'
                                                                                ) ===
                                                                                    'Approved - Tuition Fees & Maintenance Loan' ||
                                                                                    form.watch(
                                                                                        'slcStatus'
                                                                                    ) ===
                                                                                        'Approved - Tuition Fees') && (
                                                                                    <FormField
                                                                                        control={
                                                                                            form.control
                                                                                        }
                                                                                        name="tuitionFeeAmount"
                                                                                        render={({
                                                                                            field,
                                                                                        }) => (
                                                                                            <FormItem className="w-full md:w-fit">
                                                                                                <FormLabel>
                                                                                                    Tuition
                                                                                                    Fee
                                                                                                    Amount
                                                                                                </FormLabel>
                                                                                                <FormControl>
                                                                                                    <AmountInput
                                                                                                        {...field}
                                                                                                        value={
                                                                                                            field.value ??
                                                                                                            ''
                                                                                                        }
                                                                                                        onChange={(
                                                                                                            value
                                                                                                        ) => {
                                                                                                            field.onChange(
                                                                                                                value ===
                                                                                                                    ''
                                                                                                                    ? ''
                                                                                                                    : value
                                                                                                            )
                                                                                                        }}
                                                                                                        disabled={
                                                                                                            isPending
                                                                                                        }
                                                                                                    />
                                                                                                </FormControl>
                                                                                                <FormMessage />
                                                                                                {selectedCourseFee && (
                                                                                                    <p className="text-sm text-muted-foreground mt-2">
                                                                                                        Course
                                                                                                        fee:{' '}
                                                                                                        {formatCurrency(
                                                                                                            selectedCourseFee
                                                                                                        )}
                                                                                                    </p>
                                                                                                )}
                                                                                                {paymentStatus.insufficientTuition && (
                                                                                                    <div className="mt-2 p-4 bg-red-50 rounded-md space-y-2">
                                                                                                        <p className="text-sm font-medium text-destructive">
                                                                                                            Your
                                                                                                            tuition
                                                                                                            fee
                                                                                                            is{' '}
                                                                                                            {formatCurrency(
                                                                                                                paymentStatus.difference ||
                                                                                                                    0
                                                                                                            )}{' '}
                                                                                                            less
                                                                                                            than
                                                                                                            the
                                                                                                            course
                                                                                                            fee.
                                                                                                        </p>
                                                                                                        <p className="text-sm text-destructive">
                                                                                                            This
                                                                                                            shortfall
                                                                                                            will
                                                                                                            be
                                                                                                            flagged
                                                                                                            for
                                                                                                            administrative
                                                                                                            review.
                                                                                                        </p>
                                                                                                    </div>
                                                                                                )}
                                                                                            </FormItem>
                                                                                        )}
                                                                                    />
                                                                                )}

                                                                                {(form.watch(
                                                                                    'slcStatus'
                                                                                ) ===
                                                                                    'Approved - Tuition Fees & Maintenance Loan' ||
                                                                                    form.watch(
                                                                                        'slcStatus'
                                                                                    ) ===
                                                                                        'Approved - Maintenance Loan') && (
                                                                                    <FormField
                                                                                        control={
                                                                                            form.control
                                                                                        }
                                                                                        name="maintenanceLoanAmount"
                                                                                        render={({
                                                                                            field,
                                                                                        }) => (
                                                                                            <FormItem className="w-full md:w-fit">
                                                                                                <FormLabel>
                                                                                                    Maintenance
                                                                                                    Loan
                                                                                                    Amount
                                                                                                </FormLabel>
                                                                                                <FormControl>
                                                                                                    <AmountInput
                                                                                                        {...field}
                                                                                                        value={
                                                                                                            field.value ??
                                                                                                            ''
                                                                                                        }
                                                                                                        onChange={(
                                                                                                            value
                                                                                                        ) => {
                                                                                                            field.onChange(
                                                                                                                value ===
                                                                                                                    ''
                                                                                                                    ? ''
                                                                                                                    : value
                                                                                                            )
                                                                                                        }}
                                                                                                        disabled={
                                                                                                            isPending
                                                                                                        }
                                                                                                    />
                                                                                                </FormControl>
                                                                                                <FormMessage />
                                                                                                {selectedCourseFee && (
                                                                                                    <p className="text-sm text-muted-foreground mt-2">
                                                                                                        Course
                                                                                                        fee:{' '}
                                                                                                        {formatCurrency(
                                                                                                            selectedCourseFee
                                                                                                        )}
                                                                                                    </p>
                                                                                                )}
                                                                                                {paymentStatus.insufficientMaintenance && (
                                                                                                    <div className="mt-2 p-4 bg-destructive/10 rounded-md space-y-2">
                                                                                                        <p className="text-sm font-medium text-destructive">
                                                                                                            Your
                                                                                                            maintenance
                                                                                                            loan
                                                                                                            is{' '}
                                                                                                            {formatCurrency(
                                                                                                                paymentStatus.difference ||
                                                                                                                    0
                                                                                                            )}{' '}
                                                                                                            less
                                                                                                            than
                                                                                                            the
                                                                                                            course
                                                                                                            fee.
                                                                                                        </p>
                                                                                                        <p className="text-sm text-destructive">
                                                                                                            This
                                                                                                            shortfall
                                                                                                            will
                                                                                                            be
                                                                                                            flagged
                                                                                                            for
                                                                                                            administrative
                                                                                                            review.
                                                                                                        </p>
                                                                                                    </div>
                                                                                                )}
                                                                                            </FormItem>
                                                                                        )}
                                                                                    />
                                                                                )}

                                                                                {/* Maintenance Option for Tuition Fee Shortfall */}
                                                                                {showMaintenanceOption && (
                                                                                    <div className="mt-4 p-4 bg-neutral-100 rounded-md space-y-4">
                                                                                        <div className="space-y-4">
                                                                                            {' '}
                                                                                            {/* Increased space-y for better mobile spacing */}
                                                                                            <p className="text-sm font-medium">
                                                                                                Would
                                                                                                you
                                                                                                like
                                                                                                to
                                                                                                use
                                                                                                your
                                                                                                maintenance
                                                                                                loan
                                                                                                to
                                                                                                cover
                                                                                                the
                                                                                                remaining
                                                                                                tuition
                                                                                                fee
                                                                                                of{' '}
                                                                                                {formatCurrency(
                                                                                                    paymentStatus.difference ||
                                                                                                        0
                                                                                                )}

                                                                                                ?
                                                                                            </p>
                                                                                            <div className="flex flex-wrap gap-2 items-center md:flex-row md:space-y-0 md:space-x-2">
                                                                                                {' '}
                                                                                                {/* Modified this div */}
                                                                                                <Button
                                                                                                    type="button"
                                                                                                    variant="outline"
                                                                                                    size="sm"
                                                                                                    className="w-full sm:w-auto"
                                                                                                    disabled={
                                                                                                        isPending
                                                                                                    }
                                                                                                    onClick={() => {
                                                                                                        if (
                                                                                                            !paymentStatus.difference
                                                                                                        )
                                                                                                            return

                                                                                                        console.log(
                                                                                                            'Current payment status:',
                                                                                                            paymentStatus
                                                                                                        )
                                                                                                        console.log(
                                                                                                            'Difference amount:',
                                                                                                            paymentStatus.difference
                                                                                                        )

                                                                                                        const payments =
                                                                                                            createPaymentPlan(
                                                                                                                paymentStatus.difference
                                                                                                            )

                                                                                                        form.setValue(
                                                                                                            'expectedPayments',
                                                                                                            payments.map(
                                                                                                                (
                                                                                                                    payment
                                                                                                                ) => ({
                                                                                                                    ...payment,
                                                                                                                    date: new Date(),
                                                                                                                    university:
                                                                                                                        'Plymouth Marjon University',
                                                                                                                    course:
                                                                                                                        form.watch(
                                                                                                                            'expectedPayments.0.course'
                                                                                                                        ) ||
                                                                                                                        '',
                                                                                                                })
                                                                                                            ),
                                                                                                            {
                                                                                                                shouldValidate: true,
                                                                                                            }
                                                                                                        )

                                                                                                        setUseMaintenanceForTuition(
                                                                                                            true
                                                                                                        )
                                                                                                        setShowMaintenanceOption(
                                                                                                            false
                                                                                                        )

                                                                                                        form.setValue(
                                                                                                            'usingMaintenanceForTuition',
                                                                                                            true,
                                                                                                            {
                                                                                                                shouldValidate: true,
                                                                                                                shouldDirty: true,
                                                                                                            }
                                                                                                        )

                                                                                                        console.log(
                                                                                                            'foobar',
                                                                                                            form.getValues(
                                                                                                                'courseFee'
                                                                                                            )
                                                                                                        )
                                                                                                    }}
                                                                                                >
                                                                                                    Yes,
                                                                                                    use
                                                                                                    maintenance
                                                                                                    loan
                                                                                                </Button>
                                                                                                <Button
                                                                                                    type="button"
                                                                                                    variant="outline"
                                                                                                    size="sm"
                                                                                                    className="w-full sm:w-auto"
                                                                                                    disabled={
                                                                                                        isPending
                                                                                                    }
                                                                                                    onClick={() =>
                                                                                                        setShowMaintenanceOption(
                                                                                                            false
                                                                                                        )
                                                                                                    }
                                                                                                >
                                                                                                    No,
                                                                                                    I&apos;ll
                                                                                                    pay
                                                                                                    another
                                                                                                    way
                                                                                                </Button>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                )}

                                                                                <FormField
                                                                                    control={
                                                                                        form.control
                                                                                    }
                                                                                    name="ssn"
                                                                                    render={({
                                                                                        field,
                                                                                    }) => (
                                                                                        <FormItem className="w-full md:w-fit">
                                                                                            <FormLabel>
                                                                                                Student
                                                                                                Support
                                                                                                Number
                                                                                                (SSN)
                                                                                            </FormLabel>
                                                                                            <FormControl>
                                                                                                <Input
                                                                                                    {...field}
                                                                                                    disabled={
                                                                                                        isPending
                                                                                                    }
                                                                                                    onChange={(
                                                                                                        e
                                                                                                    ) => {
                                                                                                        field.onChange(
                                                                                                            e.target.value.toUpperCase()
                                                                                                        )
                                                                                                    }}
                                                                                                    placeholder="Enter your SSN"
                                                                                                />
                                                                                            </FormControl>
                                                                                            <FormMessage />
                                                                                        </FormItem>
                                                                                    )}
                                                                                />

                                                                                <div className="flex flex-col">
                                                                                    <div className="flex flex-col space-y-2 mb-4">
                                                                                        <FormLabel>
                                                                                            Expected
                                                                                            Payments
                                                                                            {useMaintenanceForTuition && (
                                                                                                <span className="text-sm font-normal text-muted-foreground ml-2">
                                                                                                    (Including
                                                                                                    maintenance
                                                                                                    loan
                                                                                                    payment)
                                                                                                </span>
                                                                                            )}
                                                                                        </FormLabel>
                                                                                        {isCreatingPaymentPlan && (
                                                                                            <p className="text-sm text-muted-foreground">
                                                                                                Creating
                                                                                                payment
                                                                                                plan...
                                                                                            </p>
                                                                                        )}

                                                                                        {fields.map(
                                                                                            (
                                                                                                field,
                                                                                                index
                                                                                            ) => (
                                                                                                <div
                                                                                                    key={
                                                                                                        field.id
                                                                                                    }
                                                                                                    className="pt-4 space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4"
                                                                                                >
                                                                                                    <FormField
                                                                                                        control={
                                                                                                            form.control
                                                                                                        }
                                                                                                        name={`expectedPayments.${index}.date`}
                                                                                                        render={({
                                                                                                            field,
                                                                                                        }) => (
                                                                                                            <FormItem className="flex flex-col space-y-2">
                                                                                                                {' '}
                                                                                                                {/* Added space-y-2 */}
                                                                                                                <div className="md:block hidden">
                                                                                                                    {' '}
                                                                                                                    {/* Wrapper for non-sr label */}
                                                                                                                    <FormLabel>
                                                                                                                        Date
                                                                                                                    </FormLabel>
                                                                                                                </div>
                                                                                                                <Popover>
                                                                                                                    <PopoverTrigger
                                                                                                                        asChild
                                                                                                                    >
                                                                                                                        <FormControl>
                                                                                                                            <Button
                                                                                                                                disabled={
                                                                                                                                    isPending
                                                                                                                                }
                                                                                                                                variant={
                                                                                                                                    'outline'
                                                                                                                                }
                                                                                                                                className={cn(
                                                                                                                                    'w-full pl-3 text-left font-normal',
                                                                                                                                    !field.value &&
                                                                                                                                        'text-muted-foreground'
                                                                                                                                )}
                                                                                                                            >
                                                                                                                                {field.value ? (
                                                                                                                                    format(
                                                                                                                                        field.value,
                                                                                                                                        'PPP'
                                                                                                                                    )
                                                                                                                                ) : (
                                                                                                                                    <span>
                                                                                                                                        Pick
                                                                                                                                        a
                                                                                                                                        date
                                                                                                                                    </span>
                                                                                                                                )}
                                                                                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                                                                            </Button>
                                                                                                                        </FormControl>
                                                                                                                    </PopoverTrigger>
                                                                                                                    <PopoverContent
                                                                                                                        className="w-auto p-0"
                                                                                                                        align="start"
                                                                                                                    >
                                                                                                                        <Calendar
                                                                                                                            mode="single"
                                                                                                                            selected={
                                                                                                                                field.value
                                                                                                                            }
                                                                                                                            onSelect={
                                                                                                                                field.onChange
                                                                                                                            }
                                                                                                                            disabled={(
                                                                                                                                date
                                                                                                                            ) =>
                                                                                                                                date >
                                                                                                                                new Date(
                                                                                                                                    '2100-01-01'
                                                                                                                                )
                                                                                                                            }
                                                                                                                            initialFocus
                                                                                                                            weekStartsOn={
                                                                                                                                1
                                                                                                                            }
                                                                                                                        />
                                                                                                                    </PopoverContent>
                                                                                                                </Popover>
                                                                                                                <FormMessage />
                                                                                                            </FormItem>
                                                                                                        )}
                                                                                                    />

                                                                                                    <FormField
                                                                                                        control={
                                                                                                            form.control
                                                                                                        }
                                                                                                        name={`expectedPayments.${index}.amount`}
                                                                                                        render={({
                                                                                                            field,
                                                                                                        }) => (
                                                                                                            <FormItem>
                                                                                                                <FormLabel className="sr-only md:not-sr-only">
                                                                                                                    Amount
                                                                                                                </FormLabel>
                                                                                                                <FormControl>
                                                                                                                    <AmountInput
                                                                                                                        {...field}
                                                                                                                        disabled={
                                                                                                                            isPending
                                                                                                                        }
                                                                                                                        value={
                                                                                                                            field.value ??
                                                                                                                            ''
                                                                                                                        }
                                                                                                                        onChange={(
                                                                                                                            value
                                                                                                                        ) => {
                                                                                                                            field.onChange(
                                                                                                                                value ===
                                                                                                                                    ''
                                                                                                                                    ? ''
                                                                                                                                    : value
                                                                                                                            )

                                                                                                                            // Get the latest values from the form
                                                                                                                            const values =
                                                                                                                                form.getValues(
                                                                                                                                    'expectedPayments'
                                                                                                                                )
                                                                                                                            // Update the current field's value
                                                                                                                            values[
                                                                                                                                index
                                                                                                                            ].amount =
                                                                                                                                value ===
                                                                                                                                ''
                                                                                                                                    ? 0
                                                                                                                                    : parseFloat(
                                                                                                                                          value
                                                                                                                                      )

                                                                                                                            const total =
                                                                                                                                values.reduce(
                                                                                                                                    (
                                                                                                                                        sum,
                                                                                                                                        payment
                                                                                                                                    ) => {
                                                                                                                                        return (
                                                                                                                                            sum +
                                                                                                                                            (payment.amount
                                                                                                                                                ? parseFloat(
                                                                                                                                                      payment.amount
                                                                                                                                                  )
                                                                                                                                                : 0)
                                                                                                                                        )
                                                                                                                                    },
                                                                                                                                    0
                                                                                                                                )

                                                                                                                            setTotalAmount(
                                                                                                                                total
                                                                                                                            )
                                                                                                                        }}
                                                                                                                    />
                                                                                                                </FormControl>
                                                                                                                <FormMessage />
                                                                                                            </FormItem>
                                                                                                        )}
                                                                                                    />

                                                                                                    <FormField
                                                                                                        control={
                                                                                                            form.control
                                                                                                        }
                                                                                                        name={`expectedPayments.${index}.university`}
                                                                                                        render={({
                                                                                                            field,
                                                                                                        }) => (
                                                                                                            <FormItem>
                                                                                                                <FormLabel className="sr-only md:not-sr-only">
                                                                                                                    University
                                                                                                                    or
                                                                                                                    College
                                                                                                                </FormLabel>
                                                                                                                <Select
                                                                                                                    onValueChange={
                                                                                                                        field.onChange
                                                                                                                    }
                                                                                                                    value={
                                                                                                                        field.value
                                                                                                                    }
                                                                                                                    disabled={
                                                                                                                        isPending
                                                                                                                    }
                                                                                                                >
                                                                                                                    <FormControl>
                                                                                                                        <SelectTrigger>
                                                                                                                            <SelectValue placeholder="Select university or college" />
                                                                                                                        </SelectTrigger>
                                                                                                                    </FormControl>
                                                                                                                    <SelectContent>
                                                                                                                        <SelectItem value="Plymouth Marjon University">
                                                                                                                            Plymouth
                                                                                                                            Marjon
                                                                                                                            University
                                                                                                                        </SelectItem>
                                                                                                                        <SelectItem value="Gloucestershire College">
                                                                                                                            Gloucestershire
                                                                                                                            College
                                                                                                                        </SelectItem>
                                                                                                                    </SelectContent>
                                                                                                                </Select>
                                                                                                                <FormMessage />
                                                                                                            </FormItem>
                                                                                                        )}
                                                                                                    />

                                                                                                    <FormField
                                                                                                        control={
                                                                                                            form.control
                                                                                                        }
                                                                                                        name={`expectedPayments.${index}.course`}
                                                                                                        render={({
                                                                                                            field,
                                                                                                        }) => (
                                                                                                            <FormItem>
                                                                                                                <FormLabel className="sr-only md:not-sr-only">
                                                                                                                    Course
                                                                                                                </FormLabel>
                                                                                                                <Select
                                                                                                                    onValueChange={(
                                                                                                                        value
                                                                                                                    ) => {
                                                                                                                        field.onChange(
                                                                                                                            value
                                                                                                                        )
                                                                                                                        // handleCourseSelection(value);
                                                                                                                    }}
                                                                                                                    value={
                                                                                                                        field.value
                                                                                                                    }
                                                                                                                    disabled={
                                                                                                                        isPending
                                                                                                                    }
                                                                                                                >
                                                                                                                    <FormControl>
                                                                                                                        <SelectTrigger>
                                                                                                                            <SelectValue placeholder="Select your course" />
                                                                                                                        </SelectTrigger>
                                                                                                                    </FormControl>
                                                                                                                    <SelectContent>
                                                                                                                        {courses.map(
                                                                                                                            (
                                                                                                                                course
                                                                                                                            ) => (
                                                                                                                                <SelectItem
                                                                                                                                    className="w-full"
                                                                                                                                    key={
                                                                                                                                        course.id
                                                                                                                                    }
                                                                                                                                    value={
                                                                                                                                        course.name
                                                                                                                                    }
                                                                                                                                >
                                                                                                                                    {
                                                                                                                                        course.name
                                                                                                                                    }
                                                                                                                                </SelectItem>
                                                                                                                            )
                                                                                                                        )}
                                                                                                                    </SelectContent>
                                                                                                                </Select>
                                                                                                                <FormMessage />
                                                                                                            </FormItem>
                                                                                                        )}
                                                                                                    />

                                                                                                    <Button
                                                                                                        type="button"
                                                                                                        variant="destructive"
                                                                                                        size="sm"
                                                                                                        onClick={() =>
                                                                                                            remove(
                                                                                                                index
                                                                                                            )
                                                                                                        }
                                                                                                        disabled={
                                                                                                            isPending
                                                                                                        }
                                                                                                        className="w-full md:col-span-2 lg:col-span-3"
                                                                                                    >
                                                                                                        <Trash className="h-4 w-4 mr-2" />
                                                                                                        Remove
                                                                                                        Payment
                                                                                                    </Button>
                                                                                                </div>
                                                                                            )
                                                                                        )}

                                                                                        <Button
                                                                                            type="button"
                                                                                            variant="outline"
                                                                                            size="sm"
                                                                                            className="mt-8 w-full md:w-fit"
                                                                                            disabled={
                                                                                                isPending
                                                                                            }
                                                                                            onClick={() =>
                                                                                                append(
                                                                                                    {
                                                                                                        date: undefined,
                                                                                                        amount: undefined,
                                                                                                        university:
                                                                                                            '',
                                                                                                        course:
                                                                                                            form.watch(
                                                                                                                'expectedPayments.0.course'
                                                                                                            ) ||
                                                                                                            '',
                                                                                                    }
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            <Plus className="mr-2 h-4 w-4" />
                                                                                            Add
                                                                                            Payment
                                                                                        </Button>

                                                                                        {form
                                                                                            .formState
                                                                                            .errors
                                                                                            .expectedPayments && (
                                                                                            <p className="mt-2 text-[0.8rem] font-medium text-destructive">
                                                                                                {
                                                                                                    form
                                                                                                        .formState
                                                                                                        .errors
                                                                                                        .expectedPayments
                                                                                                        .message
                                                                                                }
                                                                                            </p>
                                                                                        )}

                                                                                        {form
                                                                                            .formState
                                                                                            .errors
                                                                                            .expectedPayments
                                                                                            ?.root
                                                                                            ?.message && (
                                                                                            <p className="mt-2 text-[0.8rem] font-medium text-destructive">
                                                                                                {
                                                                                                    form
                                                                                                        .formState
                                                                                                        .errors
                                                                                                        .expectedPayments
                                                                                                        .root
                                                                                                        .message
                                                                                                }
                                                                                            </p>
                                                                                        )}
                                                                                    </div>

                                                                                    <FormField
                                                                                        control={
                                                                                            form.control
                                                                                        }
                                                                                        name="file"
                                                                                        render={({
                                                                                            field,
                                                                                        }) => (
                                                                                            <FormItem>
                                                                                                <FormLabel>
                                                                                                    Upload
                                                                                                    File
                                                                                                </FormLabel>
                                                                                                <FormControl>
                                                                                                    <MultiUploader
                                                                                                        onChange={(
                                                                                                            file,
                                                                                                            removed
                                                                                                        ) => {
                                                                                                            setTuitionFile(
                                                                                                                file
                                                                                                            )
                                                                                                            setIsRemoved(
                                                                                                                removed
                                                                                                            )

                                                                                                            const newAccumulatedFiles =
                                                                                                                {
                                                                                                                    ...accumulatedFiles,
                                                                                                                }
                                                                                                            newAccumulatedFiles.tuitionDoc =
                                                                                                                {
                                                                                                                    file,
                                                                                                                    alreadyExists: false,
                                                                                                                }
                                                                                                            setAccumulatedFiles(
                                                                                                                newAccumulatedFiles
                                                                                                            )
                                                                                                        }}
                                                                                                        defaultFile={
                                                                                                            accumulatedFiles
                                                                                                                .tuitionDoc
                                                                                                                ?.file ||
                                                                                                            tuitionFile
                                                                                                        }
                                                                                                        defaultPreviewUrl={
                                                                                                            accumulatedFiles
                                                                                                                .tuitionDoc
                                                                                                                ?.alreadyExists
                                                                                                                ? application?.tuition_doc_url
                                                                                                                : accumulatedFiles
                                                                                                                      .tuitionDoc
                                                                                                                      ?.file
                                                                                                                ? URL.createObjectURL(
                                                                                                                      accumulatedFiles
                                                                                                                          .tuitionDoc
                                                                                                                          .file
                                                                                                                  )
                                                                                                                : null
                                                                                                        }
                                                                                                        isPending={
                                                                                                            isPending
                                                                                                        }
                                                                                                        fileType="file"
                                                                                                    />
                                                                                                </FormControl>
                                                                                                <FormMessage />
                                                                                            </FormItem>
                                                                                        )}
                                                                                    />

                                                                                    {/* Total Amount Display */}
                                                                                    <div className="mt-6">
                                                                                        <h3 className="text-lg font-semibold">
                                                                                            Total
                                                                                            Expected
                                                                                            Payments:{' '}
                                                                                            {formatCurrency(
                                                                                                totalAmount
                                                                                            )}
                                                                                        </h3>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
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
                        isFirstStep={isFirstStep}
                        isPending={isPending}
                        onSave={saveForm}
                        nextStep={onNext}
                    />
                </form>
            </Form>
        </div>
    )
}
