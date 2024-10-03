'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
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

import { LoginSchema } from '@/schemas'
import { login } from '@/actions/login'
import { useMedia } from 'react-use'

export function LoginForm() {
    const [formErrors, setFormErrors] = useState()
    const [error, setError] = useState()
    const [success, setSuccess] = useState()
    const [isPending, startTransition] = useTransition()

    const searchParams = useSearchParams()
    const isWide = useMedia('(min-width: 1280px)', false)
    const callbackURL = searchParams.get('callbackURL')

    const form = useForm({
        defaultValues: {
            email: '',
            password: '',
        },
    })

    const onSubmit = (values) => {
        setFormErrors()
        setError('')
        setSuccess('')

        const isValid = LoginSchema.safeParse(values)

        if (!isValid.success) {
            setFormErrors(isValid.error.formErrors.fieldErrors)
            return
        }

        startTransition(() => {
            login(values, callbackURL).then((data) => {
                if (data?.error) {
                    setError(data.error)
                }

                if (data?.success) {
                    form.reset()
                }
            })
        })
    }

  return (
    <div className="w-full h-full lg:grid lg:grid-cols-2 flex items-center justify-center">
      <div className="flex items-center justify-center">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="mx-auto grid sm:w-[440px] gap-6">
              <div className="grid gap-2">
                <h1 className="text-3xl font-semibold text-black">
                  Welcome back
                </h1>
                <p className="text-balance text-muted-foreground">
                  Please enter your details to continue
                </p>
              </div>
              <FormError message={formErrors || error} />
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
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
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
                  <Link
                    href="/auth/reset-password"
                    className="ml-auto inline-block text-sm underline my-2 hover:text-gray-500"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Button type="submit" className="w-full text-white">
                  {isPending ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <p>Sign in</p>
                  )}
                </Button>
              </div>
              <div className="text-center text-sm text-muted-foreground">
                New to City of London College?{" "}
                <Link
                  href="/auth/register"
                  className="font-medium text-black hover:text-black/95"
                >
                  Create an account
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
  );
}
