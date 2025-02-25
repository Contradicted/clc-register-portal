'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { EyeIcon, EyeOffIcon, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from "@/components/ui/form";

import { FormError } from "@/components/FormError";

import { LoginSchema } from "@/schemas";
import { login } from "@/actions/login";
import { useMedia } from "react-use";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const [formErrors, setFormErrors] = useState();
  const [error, setError] = useState();
  const [success, setSuccess] = useState();
  const [isVisible, setIsVisible] = useState(false);
  const [isPending, startTransition] = useTransition();

  const searchParams = useSearchParams();
  const isWide = useMedia("(min-width: 1280px)", false);
  const callbackURL = searchParams.get("callbackURL");

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

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
      login(values, callbackURL).then((data) => {
        if (data?.error) {
          setError(data.error);
        }

        if (data?.success) {
          form.reset();
        }
      });
    });
  };

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
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          Please enter your email in lowercase (e.g.,
                          name@example.com)
                        </p>
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
                          <div className="relative">
                            <Input
                              {...field}
                              type={isVisible ? "text" : "password"}
                              placeholder="*******"
                              disabled={isPending}
                            />
                            <Button
                              type="button"
                              variant="icon"
                              disabled={isPending}
                              onClick={() => setIsVisible(!isVisible)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                              aria-label={
                                isVisible ? "Hide password" : "Show password"
                              }
                            >
                              {isVisible ? (
                                <EyeOffIcon className="h-4 w-4" />
                              ) : (
                                <EyeIcon className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Link
                    href="/auth/reset-password"
                    className={cn(
                      "ml-auto inline-block text-sm underline my-2 hover:text-gray-500",
                      isPending && "text-neutral-400 pointer-events-none"
                    )}
                    aria-disabled={isPending}
                    tabIndex={isPending ? -1 : undefined}
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Button
                  type="submit"
                  className="w-full text-white"
                  disabled={isPending}
                >
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
                  className={cn(
                    "font-medium text-black hover:text-black/95",
                    isPending && "text-neutral-400 pointer-events-none"
                  )}
                  aria-disabled={isPending}
                  tabIndex={isPending ? -1 : undefined}
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
          src="/logo.png"
          alt="Image"
          width={isWide ? 850 : 1000}
          height={isWide ? 850 : 1000}
          className="p-10 dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
