import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useSelector } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import z from "zod";
import { Button } from "@reactive-resume/ui/components/button";
import { Checkbox } from "@reactive-resume/ui/components/checkbox";
import { FormControl, FormItem, FormLabel, FormMessage } from "@reactive-resume/ui/components/form";
import { Input } from "@reactive-resume/ui/components/input";
import { toast } from "@reactive-resume/ui/components/toast";
import { AuthPanel } from "../components/auth-panel";
import { SocialAuth } from "../components/social-auth";
import { getAuthRedirectOptions, getOAuthSignInOptions, isOAuthRedirect } from "../redirect";
import { PasswordInput } from "@/components/input/password-input";
import { authClient } from "@/libs/auth/client";
import { sessionQueryKey } from "@/libs/root-context";
import { useAppForm } from "@/libs/tanstack-form";

const formSchema = z.object({
	name: z.string().trim().min(1, { message: t`Enter your name.` }).max(64, { message: t`Name is too long.` }),
	username: z
		.string()
		.min(3, { message: t`Username must be at least 3 characters.` })
		.max(64, { message: t`Username is too long.` })
		.trim()
		.toLowerCase()
		.regex(/^[a-z0-9._-]+$/, {
			message: t`Username can only contain lowercase letters, numbers, dots, hyphens and underscores.`,
		}),
	email: z.email({ message: t`Enter a valid email address.` }).toLowerCase(),
	password: z
		.string()
		.min(8, { message: t`Password must be at least 8 characters.` })
		.max(64, { message: t`Password is too long.` }),
	accepted: z.boolean().refine((value) => value, {
		message: t`Agree to the Terms of Service and Privacy Policy to continue.`,
	}),
});

type Props = {
	disableEmailAuth: boolean;
};

export function RegisterPage({ disableEmailAuth }: Props) {
	const { callbackURL, reauthenticate } = useSearch({ from: "/auth" });
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const form = useAppForm({
		defaultValues: { name: "", username: "", email: "", password: "", accepted: false },
		validators: { onSubmit: formSchema },
		onSubmit: async ({ value }) => {
			const toastId = toast.add({ type: "loading", description: t`Signing up...` });

			const oauthOptions = getOAuthSignInOptions(callbackURL);
			const createPrompt = new URLSearchParams(oauthOptions.oauth_query).get("prompt")?.split(" ").includes("create");
			const { data, error } = await authClient.signUp.email({
				name: value.name.trim(),
				email: value.email,
				password: value.password,
				username: value.username,
				displayUsername: value.username,
				callbackURL: callbackURL ?? "/dashboard",
				...(!createPrompt ? oauthOptions : {}),
			});

			if (error) {
				toast.add({
					type: "error",
					description:
						error.message ||
						t({
							comment: "Fallback toast when account registration fails without a server error message",
							message: "Failed to create your account. Please try again.",
						}),
					id: toastId,
				});
				return;
			}

			if (isOAuthRedirect(data)) return;
			if (createPrompt && oauthOptions.oauth_query) {
				const continuation = await authClient.oauth2.continue({ created: true, oauth_query: oauthOptions.oauth_query });
				if (continuation.error) {
					toast.add({ type: "error", description: continuation.error.message, id: toastId });
					return;
				}
				if (isOAuthRedirect(continuation.data)) return;
			}
			await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
			toast.add({
				type: "success",
				description: t`Account created. You can verify your email from the dashboard.`,
				id: toastId,
			});
			void navigate(getAuthRedirectOptions(callbackURL));
		},
	});

	const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);

	return (
		<AuthPanel
			title={<Trans>Create a new account</Trans>}
			footer={
				<>
					<Trans>Already have an account?</Trans>{" "}
					<Link
						to="/auth/login"
						search={{ callbackURL, reauthenticate }}
						className="font-medium text-ink underline underline-offset-4"
					>
						<Trans comment="Call-to-action link from registration page to login page">Sign in</Trans>
					</Link>
				</>
			}
		>
			{!disableEmailAuth && (
				<form
					className="space-y-4"
					onSubmit={(event) => {
						event.preventDefault();
						event.stopPropagation();
						void form.handleSubmit();
					}}
				>
					<form.Field name="name">
						{(field) => (
							<FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
								<FormLabel>
									<Trans comment="Label for full name input on registration form">Name</Trans>
								</FormLabel>
								<FormControl
									render={
										<Input
											minLength={1}
											maxLength={64}
											autoComplete="section-register name"
											placeholder={t({
												comment: "Example full name placeholder on registration form",
												message: "Nama lengkap",
											})}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) => field.handleChange(event.target.value)}
										/>
									}
								/>
								<FormMessage errors={field.state.meta.errors} />
							</FormItem>
						)}
					</form.Field>

					<form.Field name="username">
						{(field) => (
							<FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
								<FormLabel>
									<Trans comment="Label for username input on registration form">Username</Trans>
								</FormLabel>
								<FormControl
									render={
										<Input
											minLength={3}
											maxLength={64}
											autoComplete="section-register username"
											placeholder={t({
												comment: "Example username placeholder on registration form",
												message: "nama.pengguna",
											})}
											className="lowercase"
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) => field.handleChange(event.target.value)}
										/>
									}
								/>
								<FormMessage errors={field.state.meta.errors} />
							</FormItem>
						)}
					</form.Field>

					<form.Field name="email">
						{(field) => (
							<FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
								<FormLabel>
									<Trans comment="Label for email input on registration form">Email Address</Trans>
								</FormLabel>
								<FormControl
									render={
										<Input
											type="email"
											autoComplete="section-register email"
											placeholder="nama@email.com"
											className="lowercase"
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) => field.handleChange(event.target.value)}
										/>
									}
								/>
								<FormMessage errors={field.state.meta.errors} />
							</FormItem>
						)}
					</form.Field>

					<form.Field name="password">
						{(field) => (
							<FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
								<FormLabel>
									<Trans comment="Label for password input on registration form">Password</Trans>
								</FormLabel>
								<FormControl
									render={
										<PasswordInput
											minLength={8}
											maxLength={64}
											autoComplete="section-register new-password"
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) => field.handleChange(event.target.value)}
										/>
									}
								/>
								<FormMessage errors={field.state.meta.errors} />
							</FormItem>
						)}
					</form.Field>

					<form.Field name="accepted">
						{(field) => (
							<FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
								<label htmlFor={field.name} className="flex items-start gap-2.5 text-[13px] leading-5 text-ink-2">
									<Checkbox
										id={field.name}
										name={field.name}
										checked={field.state.value}
										onCheckedChange={field.handleChange}
										aria-label={t`Agree to the Terms of Service and Privacy Policy`}
										className="mt-0.5"
									/>
									<span>
										<Trans>
											I agree to the <a href="/syarat" className="font-medium text-accent-text underline-offset-4 hover:underline">Terms of Service</a>{" "}
											and <a href="/privasi" className="font-medium text-accent-text underline-offset-4 hover:underline">Privacy Policy</a>, including data
											processing to run the service.
										</Trans>
									</span>
								</label>
								<FormMessage errors={field.state.meta.errors} />
							</FormItem>
						)}
					</form.Field>

					<Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
						<Trans comment="Primary action button label on registration form">Sign up</Trans>
					</Button>
				</form>
			)}

			<div className="mt-5">
				<SocialAuth />
			</div>
			<p className="mt-3 text-center text-[12.5px] leading-5 text-ink-3">
				<Trans>
					By signing up with Google or GitHub, you agree to the{" "}
					<a href="/syarat" className="underline underline-offset-4 hover:text-accent-text">Terms of Service</a> and{" "}
					<a href="/privasi" className="underline underline-offset-4 hover:text-accent-text">Privacy Policy</a>.
				</Trans>
			</p>
		</AuthPanel>
	);
}
