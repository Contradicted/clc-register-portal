'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
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

import { ResetPasswordSchema } from '@/schemas'

import { reset } from '@/actions/reset'
import { getUserByEmail } from '@/data/user'
import { FormSuccess } from '@/components/FormSuccess'
import { useMedia } from 'react-use'

export function ResetPasswordForm() {
    const [formErrors, setFormErrors] = useState()
    const [error, setError] = useState()
    const [success, setSuccess] = useState()
    const [isPending, startTransition] = useTransition()

    const isWide = useMedia('(min-width: 1280px)', false)

    const form = useForm({
        defaultValues: {
            email: '',
        },
    })

    const onSubmit = async (values) => {
        setFormErrors()
        setError('')
        setSuccess('')

        const isValid = ResetPasswordSchema.safeParse(values)

        if (!isValid.success) {
            setFormErrors(isValid.error.formErrors.fieldErrors)
            return
        }

        const user = await getUserByEmail(values.email)

        if (user) {
            console.log('Yes')
        }

        startTransition(() => {
            reset(values).then((data) => {
                if (data?.error) {
                    setError(data.error)
                }

                if (data?.success) {
                    setSuccess(data.success)
                    form.reset()
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
                                    Forgot your password
                                </h1>
                                <p className="text-balance text-muted-foreground">
                                    Please enter your email to send a reset
                                    password link
                                </p>
                            </div>
                            <FormError message={formErrors || error} />
                            <FormSuccess message={success} />
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type="email"
                                                        placeholder="m@example.com"
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
                                        <p>Send reset email</p>
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
