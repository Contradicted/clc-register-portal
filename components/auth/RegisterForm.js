'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { EyeIcon, EyeOffIcon, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";

import { RegisterSchema } from "@/schemas";
import { register } from "@/actions/register";
import { FormError } from "@/components/FormError";
import { useMedia } from "react-use";
import { cn } from "@/lib/utils";

export function RegisterForm() {
  const [formErrors, setFormErrors] = useState();
  const [error, setError] = useState();
  const [isVisible, setIsVisible] = useState(false);
  const [success, setSuccess] = useState();
  const [isPending, startTransition] = useTransition();

  const { toast } = useToast();
  const router = useRouter();
  const isWide = useMedia("(min-width: 1280px)", false);

  const form = useForm({
    defaultValues: {
      title: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = (values) => {
    setFormErrors();
    setError("");
    setSuccess("");

    const isValid = RegisterSchema.safeParse(values);

    if (!isValid.success) {
      setFormErrors(isValid.error.formErrors.fieldErrors);
      return;
    }

    startTransition(() => {
      register(values).then((data) => {
        if (data?.error) {
          setError(data.error);
        }

        if (data?.success) {
          form.reset();

          toast({
            variant: "success",
            title: data.success,
          });

          router.push("/auth/login");
        }
      });
    });
  };

  return (
    <div className="h-full w-full lg:grid lg:grid-cols-2 flex items-center justify-center">
      <div className="flex items-center justify-center py-12">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="mx-auto grid sm:w-[440px] gap-6">
              <div className="grid gap-2">
                <h1 className="text-3xl font-semibold text-black">
                  Create an account
                </h1>
                <p className="text-balance text-muted-foreground">
                  Welcome! Please enter your details to register
                </p>
              </div>
              <FormError message={formErrors || error} />
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                            disabled={isPending}
                          >
                            <SelectTrigger className="w-[270px]">
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectItem value="Mr">Mr</SelectItem>
                                <SelectItem value="Mrs">Mrs</SelectItem>
                                <SelectItem value="Ms">Ms</SelectItem>
                                <SelectItem value="Miss">Miss</SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            placeholder="John"
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
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            placeholder="Doe"
                            disabled={isPending}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
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
                  </div>
                  <Button type="submit" className="w-full mt-6">
                    {isPending ? (
                      <LoaderCircle className="animate-spin" />
                    ) : (
                      <p>Create an account</p>
                    )}
                  </Button>
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  Already registered?{" "}
                  <Link
                    href="/auth/login"
                    className={cn(
                      "font-medium text-black",
                      isPending && "text-neutral-400 pointer-events-none"
                    )}
                    aria-disabled={isPending}
                    tabIndex={isPending ? -1 : undefined}
                  >
                    Sign in
                  </Link>
                </div>
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
