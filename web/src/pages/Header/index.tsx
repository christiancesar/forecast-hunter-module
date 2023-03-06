import { Container, Heading, Center } from "@chakra-ui/react"
type HeaderParams = {
  title: string;
}
export const Header: React.FC<HeaderParams> = ({ title }) => {
  return (
    <Container w="100%" p="10">
      <Center>
        <Heading color="teal.300">
          {title}
        </Heading>
      </Center>
    </Container>
  )
}