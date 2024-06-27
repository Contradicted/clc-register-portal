"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel,
  FormControl 
} from "@/components/ui/form";

import { FormError } from "@/components/FormError";

import { LoginSchema } from "@/schemas";
import { login } from "@/actions/login";

export function LoginForm() {

  const [formErrors, setFormErrors] = useState();
  const [error, setError] = useState();
  const [success, setSuccess] = useState();
  const [isPending, startTransition] = useTransition();

  const searchParams = useSearchParams();
  const callbackURL = searchParams.get("callbackURL");

  const form = useForm({
    defaultValues: {
      email: "",
      password: ""
    }
  })

  const onSubmit = (values) => {
    setFormErrors();
    setError("");
    setSuccess("");

    const isValid = LoginSchema.safeParse(values);

    if (!isValid.success) {
      setFormErrors(isValid.error.formErrors.fieldErrors);
      return;
    }

    startTransition(() => {
      login(values, callbackURL)
        .then((data) => {
          if (data?.error) {
           setError(data.error)
          }

          if (data?.success) {
            form.reset();
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
                <Button type="submit" className="w-full">
                  {isPending ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <p>Sign in</p>
                  )}
                </Button>
              </div>
              <div className="text-center text-sm text-muted-foreground">
                New to City of London College?{" "}
                <Link href="/auth/register" className="font-medium text-black">
                  Create an account
                </Link>
              </div>
            </div>
          </form>
        </Form>
      </div>
      <div className="hidden bg-muted lg:block lg:h-full">
        <Image
          src="/logo.svg"
          alt="Image"
          width="200"
          height="200"
          className="h-full w-full p-10 dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}