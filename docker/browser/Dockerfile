FROM public.ecr.aws/lambda/nodejs:16

ARG FUNCTION_DIR="/app"
ENV PLAYWRIGHT_BROWSERS_PATH=0

# Source App
WORKDIR $FUNCTION_DIR
COPY src .
COPY node_modules .

# Chromium
RUN apt-get update && \apt-get install -y --no-install-recommends \
  libnss3 \
  libxss1 \
  libasound2 \
  fonts-noto-color-emoji \
  libxtst6

CMD ["index.handler"]
