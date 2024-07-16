'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { LoaderCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
} from '@/components/ui/form'

import { FormError } from '@/components/FormError'

import { NewPasswordSchema } from '@/schemas'

import { getUserByEmail } from '@/data/user'
import { FormSuccess } from '@/components/FormSuccess'
import { newPassword } from '@/actions/new-password'
import { useToast } from '@/components/ui/use-toast'
import { useMedia } from 'react-use'

export function NewPasswordForm() {
    const { toast } = useToast()
    const searchParams = useSearchParams()
    const router = useRouter()
    const isWide = useMedia('(min-width: 1280px)', false)
    const token = searchParams.get('token')

    const [formErrors, setFormErrors] = useState()
    const [error, setError] = useState()
    const [success, setSuccess] = useState()
    const [isPending, startTransition] = useTransition()

    const form = useForm({
        defaultValues: {
            password: '',
        },
    })

    const onSubmit = async (values) => {
        setFormErrors()
        setError('')
        setSuccess('')

        const isValid = NewPasswordSchema.safeParse(values)

        if (!isValid.success) {
            setFormErrors(isValid.error.formErrors.fieldErrors)
            return
        }

        const user = await getUserByEmail(values.email)

        if (user) {
            console.log('Yes')
        }

        startTransition(() => {
            newPassword(values, token).then((data) => {
                if (data?.error) {
                    setError(data.error)
                }

                if (data?.success) {
                    toast({
                        variant: 'success',
                        title: data.success,
                    })

                    router.push('/auth/login')
                }
            })
        })
    }

    return (
        <div className="h-full w-full lg:grid lg:grid-cols-2 flex items-center justify-center">
            <div className="flex items-center justify-center py-12">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="mx-auto grid w-[440px] gap-6">
                            <div className="grid gap-2">
                                <h1 className="text-3xl font-semibold text-black">
                                    Reset your password
                                </h1>
                                <p className="text-balance text-muted-foreground">
                                    Please enter the new password for your
                                    account
                                </p>
                            </div>
                            <FormError message={formErrors || error} />
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    New Password
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type="password"
                                                        placeholder="*******"
                                                        disabled={isPending}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <Button type="submit" className="w-full">
                                    {isPending ? (
                                        <LoaderCircle className="animate-spin" />
                                    ) : (
                                        <p>Reset password</p>
                                    )}
                                </Button>
                            </div>
                            <div className="text-center text-sm text-muted-foreground">
                                Remembered your password?{' '}
                                <Link
                                    href="/auth/login"
                                    className="font-medium text-black"
                                >
                                    Sign in
                                </Link>
                            </div>
                        </div>
                    </form>
                </Form>
            </div>
            <div className="hidden bg-muted lg:flex lg:h-full lg:items-center lg:justify-center">
                <Image
                    src="/logo.svg"
                    alt="Image"
                    width={isWide ? 850 : 1000}
                    height={isWide ? 850 : 1000}
                    className="p-10 dark:brightness-[0.2] dark:grayscale"
                />
            </div>
        </div>
    )
}
