import {
  Tabs, TabList, TabPanels, Tab, TabPanel, Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  TableCaption,
  TableContainer,
  Badge,
  Tooltip,
  Container,
  Box,
  Stack,
  Select,
  Text,
  Checkbox
} from '@chakra-ui/react'
import React, { Fragment, useEffect, useState } from "react"
import { Header } from '../Header';

type StillClassified = {
  code: string;
  description: string;
  color: string;
  quantity: number;
  weight: number;
  stock: number;
  mrp: number;
  budgets: {
    shortId: number;
    customer: string;
    quantity: number;
  }[];
};

type Customer = {
  name: string;
  shortId: number;
}

type Color = {
  name: string;
}

export const Home: React.FC = () => {
  const [still, setStill] = useState([] as StillClassified[])
  const [customers, setCustomers] = useState([] as Customer[])
  const [colors, setColors] = useState([] as Color[])
  const [purchaseRequiredCheck, setPurchaseRequiredCheck] = useState(false)

  useEffect(() => {
    fetch('http://localhost:3333/mrp_still/')
      .then(response => response.json())
      .then((data: StillClassified[]) => {
        setStill(data)

      })
  }, [])

  useEffect(() => {

    const customersList = [] as Customer[]
    still.map((item) => {
      item.budgets.map((budget) => {
        const customer = customersList.filter((customer) => {
          return customer.shortId === budget.shortId
        })

        if (customer.length === 0) {
          customersList.push({
            name: budget.customer,
            shortId: budget.shortId
          })
        }
      })
    })

    setCustomers(customersList.sort((a, b) => a.shortId - b.shortId))
  }, [still])

  useEffect(() => {

    const colorList = [] as Color[]
    still.filter((item) => {
      const color = colorList.filter((color) => {
        return color.name === item.color
      })

      if (color.length === 0) {
        colorList.push({
          name: item.color,
        })
      }
    })

    setColors(colorList.sort((a, b) => a.name.localeCompare(b.name)))
  }, [still])

  return (
    <Container
      maxW={1600}
    >
      <Header title='Necessidade de compra' />
      <Box
        w='100%'
      >
        <Tabs isFitted variant='soft-rounded' colorScheme="teal">
          <TabList mb='1em'>
            <Tab>Perfl</Tab>
            <Tab>Acessorios</Tab>
            <Tab>Vidros</Tab>
            <Tab>Kits</Tab>
          </TabList>

          <Stack spacing={3} direction="column" p="5" bgColor="gray.800" borderRadius={5}>
            <Text>
              Filtros
            </Text>
            <Stack direction="row">
              <Select placeholder='Pedido' size='lg'>
                {
                  customers.map((customer) => {
                    return (
                      <option key={customer.shortId} value={customer.shortId}>{`${customer.shortId} | ${customer.name}`}</option>
                    )
                  })
                }
              </Select>
              <Select placeholder='Cor' size='lg'>
                {
                  colors.map((color, index) => {
                    return (
                      <option key={`${index}-${color.name}`} value={color.name}>{color.name}</option>
                    )
                  })
                }
              </Select>
            </Stack>
            <Checkbox isChecked={purchaseRequiredCheck} onChange={() => setPurchaseRequiredCheck(!purchaseRequiredCheck)} mb="2">Apenas itens com necessidade de compras</Checkbox>
          </Stack>

          <TabPanels>
            <TabPanel overflowY="auto">
              <TableContainer overflow="hidden">
                <Table variant='unstyled' size="sm">
                  <Thead  bgColor='teal.300' position="sticky" top={0}>
                    <Tr>
                      <Th p={5}>Código Produto</Th>
                      <Th>Descrição</Th>
                      <Th>Cor</Th>

                      <Th isNumeric>Quantidade</Th>
                      <Th isNumeric>Estoque</Th>
                      <Th isNumeric>MRP (Comprar)</Th>

                      <Th isNumeric>Peso Total (Kg)</Th>
                      <Th isNumeric>Orçamento(s)</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {
                      still.map((item, index) => {
                        return (
                          <Tr key={`${index}-${item.code}`}>
                            <Td>{item.code}</Td>
                            <Td>{item.description}</Td>
                            <Td>{item.color}</Td>

                            <Td isNumeric>{item.quantity}</Td>
                            <Td isNumeric>{item.stock}</Td>
                            <Td isNumeric>{item.mrp}</Td>

                            <Td isNumeric>{item.weight.toFixed(2)}</Td>
                            <Td isNumeric>{item.budgets.map((budget, index) => {
                              return (
                                <Tooltip key={`${index}-${budget.shortId}`} label={budget.customer}>
                                  <Badge mr={0.5} p={1} colorScheme='green' >{budget.shortId}</Badge>
                                </Tooltip>
                              )
                            })}</Td>
                          </Tr>
                        )
                      })
                    }
                  </Tbody>
                  <Tfoot>
                    <Tr>
                      <Th />
                      <Th />
                      <Th />

                      <Th />
                      <Th />
                      <Th isNumeric>
                        {
                          still.reduce((previous, current) => {
                            return previous + current.quantity
                          }, 0).toFixed(2)
                        }
                      </Th>

                      <Th isNumeric>
                        {
                          still.reduce((previous, current) => {
                            return previous + current.weight
                          }, 0).toFixed(2)
                        }
                      </Th>
                      <Th />
                    </Tr>
                  </Tfoot>
                </Table>
              </TableContainer>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Container>
  )
}